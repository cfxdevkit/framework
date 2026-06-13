import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { checkbox, confirm } from '@inquirer/prompts';
import type { AgentMergeCandidate, PullRequestState } from '../repo/merge.js';
import {
  currentBranch,
  inspectMergeCandidate,
  listCandidateBranches,
  loadPullRequestState,
  runDeterministicMerge,
} from '../repo/merge.js';
import { renderRepoMergeResult } from '../repo-merge-render.js';
import { runInRepoRoot } from './runtime.js';

export type { AgentMergeCandidate, RepoMergeResult } from '../repo/merge.js';
export { runDeterministicMerge } from '../repo/merge.js';
export { renderRepoMergeResult } from '../repo-merge-render.js';

const execFileAsync = promisify(execFile);

// ─── Flags ────────────────────────────────────────────────────────────────────

export type AgentMergeFlags = {
  dryRun: boolean;
  base: string | null;
  branches: string[];
};

export function parseAgentMergeFlags(rawArgs: readonly string[]): AgentMergeFlags {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  let dryRun = false;
  let base: string | null = null;
  const branches: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg) continue;
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--base') {
      base = args[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (!arg.startsWith('--')) branches.push(arg);
  }
  return { dryRun, base, branches };
}

// ─── Agent merge CLI (deterministic first → interactive fallback) ─────────────

export async function runAgentMergeCli(rawArgs: readonly string[]): Promise<void> {
  await runInRepoRoot(async () => {
    const flags = parseAgentMergeFlags(rawArgs);
    const baseBranch = flags.base ?? (await currentBranch());
    const branchNames = await listCandidateBranches(baseBranch, flags.branches);

    // Phase 1: deterministic (gh pr merge for clean PRs)
    const deterministic = await runDeterministicMerge(flags, branchNames);
    console.log(renderRepoMergeResult(deterministic));
    if (flags.dryRun) return;

    // Phase 2: interactive for remaining conflicts / no-PR branches / failures
    const needsInteraction = deterministic.results.filter(
      (r) =>
        r.outcome === 'skipped-conflict' || r.outcome === 'skipped-no-pr' || r.outcome === 'failed',
    );
    if (needsInteraction.length === 0) {
      console.log('\nAll clean PRs merged. Nothing left for interactive selection.');
      return;
    }
    if (process.stdin.isTTY !== true || process.stdout.isTTY !== true) {
      console.log(`\n${needsInteraction.length} candidate(s) need attention but no TTY available.`);
      return;
    }

    const prState = await loadPullRequestState();
    const remainingCandidates = await Promise.all(
      needsInteraction.map((r) => inspectMergeCandidate(r.branch, baseBranch, prState.map)),
    );
    const mergeableCandidates = remainingCandidates.filter((c) => c.mergeable && !c.alreadyMerged);
    if (mergeableCandidates.length === 0) {
      console.log('All remaining branches have conflicts — nothing to interactively merge.');
      return;
    }

    const selectedBranches = await checkbox(
      {
        message: `Select branches to merge locally into ${baseBranch}`,
        choices: mergeableCandidates.map((c) => ({
          value: c.name,
          name: c.name,
          description: formatMergeChoice(c),
        })),
      },
      { clearPromptOnDone: true },
    );
    if (selectedBranches.length === 0) {
      console.log('No branches selected.');
      return;
    }

    const confirmed = await confirm(
      { message: `Merge ${selectedBranches.length} branch(es) into ${baseBranch} locally?` },
      { clearPromptOnDone: true },
    );
    if (!confirmed) {
      console.log('Merge cancelled.');
      return;
    }

    for (const branch of selectedBranches) {
      try {
        await execFileAsync('git', ['merge', '--no-ff', '--no-edit', branch], {
          cwd: process.cwd(),
          maxBuffer: 1024 * 1024 * 10,
          env: { ...process.env, NO_COLOR: '1' },
        });
        console.log(`  ✓ merged ${branch}`);
      } catch (err) {
        console.log(
          `  ✗ ${branch}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`,
        );
      }
    }
  });
}

function formatMergeChoice(candidate: AgentMergeCandidate): string {
  const parts = [
    candidate.alreadyMerged
      ? 'already merged'
      : candidate.mergeable
        ? 'mergeable'
        : 'conflicts detected',
  ];
  if (candidate.pr?.mergeStateStatus) parts.push(`PR: ${candidate.pr.mergeStateStatus}`);
  return parts.join(' · ');
}

// ─── Legacy report types/renderer (kept for test compatibility) ───────────────

type AgentMergeReport = {
  baseBranch: string;
  dryRun: boolean;
  gitHubStatusNote: string | null;
  candidates: AgentMergeCandidate[];
  mergedBranches: string[];
};

export function renderAgentMergeReport(report: AgentMergeReport): string {
  const lines = [
    '# Agent Merge',
    '',
    `Base branch: ${report.baseBranch}`,
    `Dry run: ${report.dryRun ? 'yes' : 'no'}`,
    '',
  ];
  if (report.gitHubStatusNote) lines.push(`GitHub: ${report.gitHubStatusNote}`, '');
  lines.push('Candidates:', '');
  if (report.candidates.length === 0) {
    lines.push('- No candidate branches found.');
  } else {
    for (const c of report.candidates) {
      const status = c.alreadyMerged
        ? 'already merged'
        : c.mergeable
          ? 'mergeable'
          : 'not mergeable';
      lines.push(`- ${c.name}: ${status}`);
      if (c.pr) {
        lines.push(`  PR: #${c.pr.number} ${c.pr.title}`);
        lines.push(`  URL: ${c.pr.url}`);
        lines.push(`  Merge state: ${(c.pr as PullRequestState).mergeStateStatus ?? 'unknown'}`);
      }
      if (c.mergeCheckError) lines.push(`  Merge check: ${c.mergeCheckError}`);
    }
  }
  if (report.mergedBranches.length > 0) {
    lines.push('', 'Merged branches:', '');
    for (const b of report.mergedBranches) lines.push(`- ${b}`);
  }
  return lines.join('\n');
}
