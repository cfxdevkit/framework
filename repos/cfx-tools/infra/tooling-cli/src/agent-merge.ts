import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { checkbox, confirm } from '@inquirer/prompts';
import { runInRepoRoot } from './agent-runtime.js';

const execFileAsync = promisify(execFile);

export type AgentMergeFlags = {
  dryRun: boolean;
  base: string | null;
  branches: string[];
};

type PullRequestState = {
  number: number;
  title: string;
  headRefName: string;
  baseRefName: string;
  state: string;
  isDraft: boolean;
  mergeStateStatus: string | null;
  url: string;
};

export type AgentMergeCandidate = {
  name: string;
  alreadyMerged: boolean;
  mergeable: boolean;
  pr: PullRequestState | null;
  mergeCheckError?: string;
};

type AgentMergeReport = {
  baseBranch: string;
  dryRun: boolean;
  gitHubStatusNote: string | null;
  candidates: AgentMergeCandidate[];
  mergedBranches: string[];
};

export function parseAgentMergeFlags(rawArgs: readonly string[]): AgentMergeFlags {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  let dryRun = false;
  let base: string | null = null;
  const branches: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) continue;
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--base') {
      base = args[index + 1] ?? null;
      index += 1;
      continue;
    }
    branches.push(arg);
  }

  return { dryRun, base, branches };
}

export async function runAgentMergeCli(rawArgs: readonly string[]): Promise<void> {
  await runInRepoRoot(async () => {
    const flags = parseAgentMergeFlags(rawArgs);
    const baseBranch = flags.base ?? (await currentBranch());
    const branchNames = await listCandidateBranches(baseBranch, flags.branches);
    const prState = await loadPullRequestState();
    const candidates = await Promise.all(
      branchNames.map(async (branch) => await inspectMergeCandidate(branch, baseBranch, prState.map)),
    );
    const report: AgentMergeReport = {
      baseBranch,
      dryRun: flags.dryRun,
      gitHubStatusNote: prState.note,
      candidates,
      mergedBranches: [],
    };

    console.log(renderAgentMergeReport(report));

    if (flags.dryRun || process.stdin.isTTY !== true || process.stdout.isTTY !== true) {
      return;
    }

    const mergeableCandidates = candidates.filter((candidate) => candidate.mergeable && !candidate.alreadyMerged);
    if (mergeableCandidates.length === 0) {
      console.log('No mergeable branches available for selection.');
      return;
    }

    const selectedBranches =
      flags.branches.length > 0
        ? mergeableCandidates
            .filter((candidate) => flags.branches.includes(candidate.name))
            .map((candidate) => candidate.name)
        : await checkbox(
            {
              message: `Select mergeable branches to merge into ${baseBranch}`,
              choices: mergeableCandidates.map((candidate) => ({
                value: candidate.name,
                name: candidate.name,
                description: formatMergeChoice(candidate),
              })),
            },
            { clearPromptOnDone: true },
          );

    if (selectedBranches.length === 0) {
      console.log('No branches selected.');
      return;
    }

    const confirmed = await confirm(
      { message: `Merge ${selectedBranches.length} branch(es) into ${baseBranch}?` },
      { clearPromptOnDone: true },
    );
    if (!confirmed) {
      console.log('Merge cancelled.');
      return;
    }

    for (const branch of selectedBranches) {
      await execFileAsync('git', ['merge', '--no-ff', '--no-edit', branch], {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10,
        env: { ...process.env, NO_COLOR: '1' },
      });
      report.mergedBranches.push(branch);
    }

    console.log(renderAgentMergeReport(report));
  });
}

async function currentBranch(): Promise<string> {
  const { stdout } = await execFileAsync('git', ['branch', '--show-current'], {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim() || 'HEAD';
}

async function listCandidateBranches(baseBranch: string, requestedBranches: readonly string[]): Promise<string[]> {
  if (requestedBranches.length > 0) {
    return [...new Set(requestedBranches.filter((branch) => branch !== baseBranch))];
  }

  const { stdout } = await execFileAsync('git', ['branch', '--format=%(refname:short)'], {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024,
  });
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((branch) => branch !== baseBranch);
}

async function loadPullRequestState(): Promise<{
  map: Map<string, PullRequestState>;
  note: string | null;
}> {
  try {
    const { stdout } = await execFileAsync(
      'gh',
      ['pr', 'list', '--limit', '200', '--json', 'number,title,headRefName,baseRefName,state,isDraft,mergeStateStatus,url'],
      {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10,
        env: { ...process.env, NO_COLOR: '1' },
      },
    );
    const pullRequests = JSON.parse(stdout) as PullRequestState[];
    return {
      map: new Map(pullRequests.map((pr) => [pr.headRefName, pr])),
      note: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      map: new Map(),
      note: `GitHub PR state unavailable: ${message}`,
    };
  }
}

async function inspectMergeCandidate(
  branch: string,
  baseBranch: string,
  prMap: Map<string, PullRequestState>,
): Promise<AgentMergeCandidate> {
  const alreadyMerged = await isAncestor(branch, baseBranch);
  if (alreadyMerged) {
    return {
      name: branch,
      alreadyMerged: true,
      mergeable: true,
      pr: prMap.get(branch) ?? null,
    };
  }

  try {
    await execFileAsync('git', ['merge-tree', '--write-tree', baseBranch, branch], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10,
      env: { ...process.env, NO_COLOR: '1' },
    });
    return {
      name: branch,
      alreadyMerged: false,
      mergeable: true,
      pr: prMap.get(branch) ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name: branch,
      alreadyMerged: false,
      mergeable: false,
      pr: prMap.get(branch) ?? null,
      mergeCheckError: message,
    };
  }
}

async function isAncestor(branch: string, baseBranch: string): Promise<boolean> {
  try {
    await execFileAsync('git', ['merge-base', '--is-ancestor', branch, baseBranch], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}

function formatMergeChoice(candidate: AgentMergeCandidate): string {
  const parts = [candidate.alreadyMerged ? 'already merged' : candidate.mergeable ? 'mergeable' : 'conflicts detected'];
  if (candidate.pr?.mergeStateStatus) {
    parts.push(`PR: ${candidate.pr.mergeStateStatus}`);
  }
  return parts.join(' · ');
}

export function renderAgentMergeReport(report: AgentMergeReport): string {
  const lines = ['# Agent Merge', '', `Base branch: ${report.baseBranch}`, `Dry run: ${report.dryRun ? 'yes' : 'no'}`, ''];
  if (report.gitHubStatusNote) {
    lines.push(`GitHub: ${report.gitHubStatusNote}`, '');
  }
  lines.push('Candidates:', '');
  if (report.candidates.length === 0) {
    lines.push('- No candidate branches found.');
  } else {
    for (const candidate of report.candidates) {
      const status = candidate.alreadyMerged ? 'already merged' : candidate.mergeable ? 'mergeable' : 'not mergeable';
      lines.push(`- ${candidate.name}: ${status}`);
      if (candidate.pr) {
        lines.push(`  PR: #${candidate.pr.number} ${candidate.pr.title}`);
        lines.push(`  URL: ${candidate.pr.url}`);
        lines.push(`  Merge state: ${candidate.pr.mergeStateStatus ?? 'unknown'}`);
      }
      if (candidate.mergeCheckError) {
        lines.push(`  Merge check: ${candidate.mergeCheckError}`);
      }
    }
  }
  if (report.mergedBranches.length > 0) {
    lines.push('', 'Merged branches:', '');
    for (const branch of report.mergedBranches) {
      lines.push(`- ${branch}`);
    }
  }
  return lines.join('\n');
}