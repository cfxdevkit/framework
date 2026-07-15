import { confirmPrompt } from '../commit/message.js';
import { logInfo, logStep } from '../shared/logging.js';
import {
  buildTestUpkeepBaseContext,
  collectPackageTestInventory,
  discoverTestUpkeepPackages,
  parseTestUpkeepFlags,
  runPackageTestsBlock,
  summarizePackageTestFailure,
} from './discover.js';
import { generateTestUpkeepArtifact } from './generate.js';
import {
  buildTestChildSummaryContext,
  writeTestUpkeepIndex,
  writeTestUpkeepScopeArtifact,
  writeTestUpkeepSuggestions,
} from './write.js';

export async function runTestUpkeep(args) {
  if (args[0] === '--') args.shift();
  const flags = parseTestUpkeepFlags(args);
  const total = 5;

  logStep(1, total, 'Discovering testable packages');
  const packages = await discoverTestUpkeepPackages(flags);
  if (packages.length === 0) {
    logInfo('  No packages with vitest.config matched.');
    return;
  }
  logInfo(`  ${packages.length} package(s): ${packages.map((p) => p.label).join(', ')}`);

  logStep(2, total, 'Building test inventory (deterministic)');
  for (const pkg of packages) {
    pkg.inventory = await collectPackageTestInventory(pkg);
    const { sourceCount, testCount, untestedCount } = pkg.inventory;
    logInfo(`  ${pkg.label}: ${sourceCount} src, ${testCount} test, ${untestedCount} untested`);
  }

  logStep(3, total, `Running package tests [${packages.length} package(s)]`);
  if (flags.skipTestRun) {
    logInfo('  --skip-test-run: skipping vitest execution');
    for (const pkg of packages) pkg.testOutput = '(test run skipped)';
  } else {
    for (const pkg of packages) {
      process.stdout.write(`  › ${pkg.label}...`);
      const testResult = await runPackageTestsBlock(pkg);
      pkg.testOutput = testResult.output;
      pkg.initialTestPassed = testResult.ok;
      console.log(` ${testResult.ok ? '\u2713 ok' : '\u2717 failures'}`);
    }
  }

  logStep(4, total, 'Generating per-package analysis [LLM, serial]');
  const baseContext = await buildTestUpkeepBaseContext(flags);
  if (flags.write && !flags.yes) {
    const confirmed = await confirmPrompt(
      `Write suggested test files to src/ for ${packages.length} package(s)? [Y/n] `,
    );
    if (!confirmed) {
      logInfo('  Continuing in artifact-only mode.');
      flags.write = false;
    }
  }
  const completedArtifacts = new Map(); // pkg.dir -> { summary, artifact }
  const results = [];
  for (const pkg of packages) {
    logInfo(`  → ${pkg.label}`);
    try {
      const childContext = buildTestChildSummaryContext(pkg, completedArtifacts, flags);
      const result = await generateTestUpkeepArtifact(pkg, baseContext, flags, childContext);
      await writeTestUpkeepScopeArtifact(pkg, result);
      let writtenFiles = [];
      let testFailure = pkg.initialTestPassed === false ? summarizePackageTestFailure(pkg) : '';
      let testStatus = flags.skipTestRun
        ? 'skipped'
        : pkg.initialTestPassed === false
          ? 'failed before updates'
          : 'passed before updates';
      if (flags.write) {
        writtenFiles = await writeTestUpkeepSuggestions(pkg, result, flags);
        if (writtenFiles.length > 0) {
          logInfo(`    written ${writtenFiles.length} test file(s); re-running tests...`);
          const postWriteTestResult = await runPackageTestsBlock(pkg);
          pkg.testOutput = postWriteTestResult.output;
          pkg.postWriteTestPassed = postWriteTestResult.ok;
          testStatus = postWriteTestResult.ok ? 'passed after updates' : 'failed after updates';
          if (!postWriteTestResult.ok) testFailure = summarizePackageTestFailure(pkg);
          logInfo(postWriteTestResult.ok ? '    ✓ new tests pass' : '    ✗ test errors remain');
        }
      }
      const ok = !testFailure;
      logInfo(`${ok ? '    ✓' : '    ✗'} ${result.summary}`);
      if (testFailure) logInfo(`    ${testFailure}`);
      results.push({ pkg, ...result, writtenFiles, ok, error: testFailure, testStatus });
      completedArtifacts.set(pkg.dir, { summary: result.summary, artifact: result.artifact });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logInfo(`    ✗ ${message}`);
      results.push({
        pkg,
        summary: '',
        artifact: '',
        hotspots: [],
        suggestions: [],
        followups: [],
        documentedGaps: [],
        writtenFiles: [],
        ok: false,
        error: message,
        testStatus: pkg.initialTestPassed === false ? 'failed before analysis' : 'not completed',
      });
    }
  }

  logStep(5, total, 'Writing test upkeep index');
  const indexPath = await writeTestUpkeepIndex(results, flags);
  logInfo(`  report: ${indexPath}`);
  const failedResults = results.filter((result) => !result.ok);
  if (failedResults.length > 0) {
    throw new Error(
      `test-upkeep completed with ${failedResults.length} package(s) still failing validation. See ${indexPath}.`,
    );
  }
}
