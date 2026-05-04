// @ts-nocheck

import { commandBlock, commitPreflightBlock } from '../completion/index.ts';
import { appendToChangelog, generateChangelogEntry } from './changelog.ts';
import { runCodeHotspotGate, runQualityGates } from './gates.ts';
import {
  assertNoUnexpectedChanges,
  confirmPrompt,
  executeCommit,
  generateCommitMessage,
  printProposedCommit,
  resolveFilesToStage,
  writeCommitReport,
} from './message.ts';
import { detectChangedScopes } from './scope.ts';

export { changedFilesList, detectChangedScopes, resolveScope } from './scope.ts';

import { logInfo, logStep, unique } from '../shared/logging.ts';

export async function runCommit(args) {
  if (args[0] === '--') args.shift();
  const flags = parseCommitFlags(args);
  const total = 8;

  // ── Phase 1: Quality gates ────────────────────────────────────────────────
  logStep(1, total, 'Quality gates');
  const hotspotsPassed = await runCodeHotspotGate();
  if (!hotspotsPassed) {
    logInfo('\n  Commit aborted because code files exceed the hard size budget.');
    logInfo(
      '  Split oversized modules before committing. This gate cannot be bypassed with --force.',
    );
    process.exit(1);
  }
  const gatesPassed = await runQualityGates(flags);
  if (!gatesPassed && !flags.force) {
    logInfo('\n  Commit aborted due to quality gate failures. Use --force to bypass.');
    process.exit(1);
  }
  if (!gatesPassed && flags.force) {
    logInfo('  ⚠ --force: proceeding despite gate failures');
  }

  // ── Phase 2: Preflight ────────────────────────────────────────────────────
  logStep(2, total, 'Preflight checks');
  logInfo('  Ensuring GitNexus is registered...');
  await commandBlock('gitnexus ensure', 'pnpm', ['run', 'gitnexus:ensure'], { timeoutMs: 60000 });
  logInfo('  Collecting git status, diff, review, and analysis signals...');
  const preflightCtx = await commitPreflightBlock();
  logInfo('  ✓ preflight complete');

  // ── Phase 3: Detect changed scopes ───────────────────────────────────────
  logStep(3, total, 'Detecting changed scopes');
  const scopes = await detectChangedScopes();
  if (scopes.length === 0) {
    logInfo('  Nothing to commit (working tree clean).');
    return;
  }
  const initialFiles = unique(scopes.flatMap((scope) => scope.files));
  logInfo(`  ${scopes.length} scope(s): ${scopes.map((s) => s.label).join(', ')}`);

  // ── Phase 4: Per-scope changelog generation (serial) ─────────────────────
  logStep(
    4,
    total,
    `Generating changelog entries  [${flags.agent}, serial, ${scopes.length} scope(s)]`,
  );
  const changelogResults = [];
  for (const scope of scopes) {
    logInfo(`  → ${scope.label}  (${scope.files.length} file(s))`);
    try {
      const analysis = await generateChangelogEntry(scope, flags);
      logInfo(`    ✓ ${analysis.summary}`);
      changelogResults.push({ scope, ...analysis, ok: true });
    } catch (error) {
      logInfo(`    ✗ ${error.message}`);
      changelogResults.push({
        scope,
        entry: null,
        summary: '',
        risks: [],
        ok: false,
        error: String(error.message),
      });
    }
  }

  // ── Phase 5: Commit message ───────────────────────────────────────────────
  logStep(5, total, `Generating commit message  [${flags.agent}]`);
  const { response: commitResponse, commit } = await generateCommitMessage(
    preflightCtx,
    changelogResults,
    flags,
  );
  const { subject, body } = commit;
  logInfo(`  subject: ${subject}`);
  await writeCommitReport(commitResponse, changelogResults);
  logInfo('  report: artifacts/llm/reports/lemonade-commit.md');

  // ── Phase 6: Approval ─────────────────────────────────────────────────────
  logStep(6, total, 'Approval');
  printProposedCommit(subject, body);
  if (flags.dryRun) {
    logInfo('  --dry-run: skipping changelog writes, post-generation checks, staging, and commit');
    return;
  }
  if (!flags.yes) {
    const confirmed = await confirmPrompt('Write changelogs and commit? [Y/n] ');
    if (!confirmed) {
      logInfo('  Aborted.');
      return;
    }
  }

  // ── Phase 7: Write generated files and re-check ───────────────────────────
  logStep(7, total, 'Writing generated files and post-checks');
  const generatedFiles = [];
  for (const result of changelogResults.filter((item) => item.ok && item.entry)) {
    await appendToChangelog(result.scope, result.entry);
    generatedFiles.push(result.scope.changelogPath);
    logInfo(`  ✓ ${result.scope.changelogPath} updated`);
  }
  if (!flags.skipPostChecks) {
    const postChecksPassed = await runQualityGates({
      ...flags,
      withBuild: false,
    });
    if (!postChecksPassed && !flags.force) {
      logInfo('\n  Commit aborted due to post-generation check failures. Use --force to bypass.');
      process.exit(1);
    }
  } else {
    logInfo('  --skip-post-checks: skipping post-generation validation');
  }

  // ── Phase 8: Commit ───────────────────────────────────────────────────────
  logStep(8, total, 'Committing');
  const filesToStage = await resolveFilesToStage(initialFiles, generatedFiles, commit.filesToStage);
  await assertNoUnexpectedChanges(filesToStage);
  const sha = await executeCommit(subject, body, filesToStage);
  logInfo(`  ✓ Committed: ${sha}`);
}

export function parseCommitFlags(args) {
  const promptParts = [];
  let model = null;
  let quick = false;
  let dryRun = false;
  let yes = false;
  let force = false;
  let skipChecks = false;
  let skipPostChecks = false;
  let withTests = true;
  let withBuild = false;
  let agent = 'direct';
  let piProvider = process.env.PI_PROVIDER ?? null;
  let piModel = process.env.PI_MODEL ?? null;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--model') model = args[++index];
    else if (arg === '--agent') agent = args[++index];
    else if (arg === '--pi-provider') piProvider = args[++index];
    else if (arg === '--pi-model') piModel = args[++index];
    else if (arg === '--quick') quick = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg === '--yes' || arg === '-y') yes = true;
    else if (arg === '--force' || arg === '-f') force = true;
    else if (arg === '--skip-checks') skipChecks = true;
    else if (arg === '--skip-post-checks') skipPostChecks = true;
    else if (arg === '--with-tests') withTests = true;
    else if (arg === '--skip-tests') withTests = false;
    else if (arg === '--with-build') withBuild = true;
    else promptParts.push(arg);
  }
  if (!['direct', 'pi-rpc'].includes(agent)) {
    throw new Error('Commit --agent must be one of: direct, pi-rpc');
  }
  return {
    prompt: promptParts.join(' ').trim(),
    model,
    quick,
    dryRun,
    yes,
    force,
    skipChecks,
    skipPostChecks,
    withTests,
    withBuild,
    agent,
    piProvider,
    piModel,
  };
}

// ─── Quality gates ────────────────────────────────────────────────────────────
