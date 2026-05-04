// @ts-nocheck
import { commandBlock } from './lemonade-completion.ts';
import {
  buildDocsUpkeepBaseContext,
  discoverDocsUpkeepScopes,
  groupDocsUpkeepScopesByBranch,
  parseDocsUpkeepFlags,
} from './lemonade-docs-discover.ts';

export { normalizeScopeFilter } from './lemonade-docs-discover.ts';

import { confirmPrompt } from './lemonade-commit-message.ts';
import {
  generateDocsUpkeepArtifact,
  generateDocsUpkeepReplacements,
} from './lemonade-docs-generate.ts';
import {
  applyDocsUpkeepUpdates,
  buildChildSummaryContext,
  writeDocsUpkeepIndex,
  writeDocsUpkeepScopeArtifact,
} from './lemonade-docs-write.ts';
import { logInfo, logStep } from './lemonade-util.ts';

export async function runDocsUpkeep(args) {
  if (args[0] === '--') args.shift();
  const flags = parseDocsUpkeepFlags(args);
  const total = 4;

  logStep(1, total, 'Deterministic docs scan');
  const docsScan = await commandBlock('deterministic docs alignment', 'pnpm', ['run', 'llm:docs'], {
    timeoutMs: 120000,
    maxChars: 20000,
  });
  logInfo('  ✓ docs alignment artifacts refreshed');

  logStep(2, total, 'Discovering documentation folders');
  const scopes = await discoverDocsUpkeepScopes(flags);
  if (scopes.length === 0) {
    logInfo('  No documentation folders matched.');
    return;
  }
  const scopeGroups = groupDocsUpkeepScopesByBranch(scopes);
  logInfo(
    `  ${scopes.length} folder scope(s) across ${scopeGroups.length} main folder(s): ${scopeGroups
      .map((group) => `${group.branch} (${group.scopes.length})`)
      .join(', ')}`,
  );

  logStep(3, total, 'Generating folder artifacts');
  const baseContext = await buildDocsUpkeepBaseContext(docsScan, flags);
  const results = [];
  if (flags.write && !flags.yes) {
    const confirmed = await confirmPrompt(
      `Apply local LLM documentation edits to ${scopes.length} folder scope(s)? [Y/n] `,
    );
    if (!confirmed) {
      logInfo('  Continuing in artifact-only mode.');
      flags.write = false;
    }
  }
  const branchSummaries = new Map(); // branch -> top-level summary for workspace root
  for (const group of scopeGroups) {
    logInfo(`  Main folder: ${group.branch} (leaf-to-root)`);
    const completedArtifacts = group.branch === 'root' ? new Map(branchSummaries) : new Map();
    const groupResults = [];
    for (const scope of group.scopes) {
      logInfo(`  → ${scope.label}  (${scope.files.length} file(s))`);
      try {
        const childContext = buildChildSummaryContext(scope, completedArtifacts, flags);
        const result = await generateDocsUpkeepArtifact(
          scope,
          baseContext,
          {
            ...flags,
            write: false,
          },
          childContext,
        );
        if (flags.write) {
          result.replacements = await generateDocsUpkeepReplacements(
            scope,
            baseContext,
            flags,
            childContext,
          );
        }
        await writeDocsUpkeepScopeArtifact(scope, result);
        if (flags.write) await applyDocsUpkeepUpdates(scope, result);
        logInfo(`    ✓ ${result.summary}`);
        const resultEntry = { scope, ...result, ok: true };
        results.push(resultEntry);
        groupResults.push(resultEntry);
        completedArtifacts.set(scope.dir, { summary: result.summary, artifact: result.artifact });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logInfo(`    ✗ ${message}`);
        const resultEntry = {
          scope,
          summary: '',
          artifact: '',
          followups: [],
          ok: false,
          error: message,
        };
        results.push(resultEntry);
        groupResults.push(resultEntry);
      }
    }
    if (group.branch !== 'root') {
      const topResult = [...groupResults].reverse().find((result) => result.ok);
      if (topResult) {
        branchSummaries.set(group.branch, {
          summary: topResult.summary,
          artifact: topResult.artifact,
        });
      }
    }
  }

  logStep(4, total, 'Writing docs upkeep index');
  const indexPath = await writeDocsUpkeepIndex(results, flags);
  logInfo(`  report: ${indexPath}`);
}
