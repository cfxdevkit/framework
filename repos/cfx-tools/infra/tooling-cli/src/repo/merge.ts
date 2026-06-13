import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ─── Shared types ─────────────────────────────────────────────────────────────

export type PullRequestState = {
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

// ─── Structured deterministic result ─────────────────────────────────────────

export type RepoMergeStatus = 'ok' | 'partial' | 'error' | 'dry-run';

export type RepoMergeCandidateResult = {
  branch: string;
  outcome:
    | 'merged'
    | 'already-merged'
    | 'skipped-conflict'
    | 'skipped-no-pr'
    | 'failed'
    | 'dry-run-clean'
    | 'dry-run-conflict';
  pr: { number: number; title: string; url: string; mergeStateStatus: string | null } | null;
  note?: string;
};

export type RepoMergeResult = {
  status: RepoMergeStatus;
  exitCode: number;
  baseBranch: string;
  dryRun: boolean;
  gitHubNote: string | null;
  summary: {
    total: number;
    merged: number;
    alreadyMerged: number;
    conflicts: number;
    failed: number;
    skipped: number;
  };
  results: RepoMergeCandidateResult[];
};

export type RepoMergeFlags = { dryRun: boolean; base: string | null };

export async function runDeterministicMerge(
  flags: RepoMergeFlags,
  branchNames: string[],
): Promise<RepoMergeResult> {
  const baseBranch = flags.base ?? (await currentBranch());
  const prState = await loadPullRequestState();
  const candidates = await Promise.all(
    branchNames.map((b) => inspectMergeCandidate(b, baseBranch, prState.map)),
  );

  const results: RepoMergeCandidateResult[] = [];
  let merged = 0;
  let alreadyMerged = 0;
  let conflicts = 0;
  let failed = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const pr = candidate.pr
      ? {
          number: candidate.pr.number,
          title: candidate.pr.title,
          url: candidate.pr.url,
          mergeStateStatus: candidate.pr.mergeStateStatus,
        }
      : null;

    if (candidate.alreadyMerged) {
      alreadyMerged += 1;
      results.push({ branch: candidate.name, outcome: 'already-merged', pr });
      continue;
    }
    if (!candidate.mergeable) {
      conflicts += 1;
      results.push({
        branch: candidate.name,
        outcome: flags.dryRun ? 'dry-run-conflict' : 'skipped-conflict',
        pr,
        ...(candidate.mergeCheckError !== undefined ? { note: candidate.mergeCheckError } : {}),
      });
      continue;
    }
    if (flags.dryRun) {
      results.push({ branch: candidate.name, outcome: 'dry-run-clean', pr });
      continue;
    }
    if (pr) {
      try {
        await execFileAsync(
          'gh',
          ['pr', 'merge', String(pr.number), '--squash', '--delete-branch'],
          {
            cwd: process.cwd(),
            maxBuffer: 1024 * 1024 * 10,
            env: { ...process.env, NO_COLOR: '1' },
          },
        );
        merged += 1;
        results.push({
          branch: candidate.name,
          outcome: 'merged',
          pr,
          note: 'gh pr merge --squash',
        });
      } catch (error) {
        failed += 1;
        results.push({
          branch: candidate.name,
          outcome: 'failed' as const,
          pr,
          note:
            error instanceof Error
              ? (error.message.split('\n')[0] ?? 'unknown error')
              : String(error),
        });
      }
    } else {
      skipped += 1;
      results.push({
        branch: candidate.name,
        outcome: 'skipped-no-pr',
        pr: null,
        note: 'no open PR found; use cdk agent merge for local branch merges',
      });
    }
  }

  const allOk = failed === 0 && conflicts === 0;
  const status: RepoMergeStatus = flags.dryRun
    ? 'dry-run'
    : allOk
      ? 'ok'
      : merged > 0
        ? 'partial'
        : 'error';
  return {
    status,
    exitCode: !flags.dryRun && (failed > 0 || conflicts > 0) ? 1 : 0,
    baseBranch,
    dryRun: flags.dryRun,
    gitHubNote: prState.note,
    summary: { total: candidates.length, merged, alreadyMerged, conflicts, failed, skipped },
    results,
  };
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

export async function currentBranch(): Promise<string> {
  const { stdout } = await execFileAsync('git', ['branch', '--show-current'], {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim() || 'HEAD';
}

export async function listCandidateBranches(
  baseBranch: string,
  requestedBranches: readonly string[],
): Promise<string[]> {
  if (requestedBranches.length > 0) {
    return [...new Set(requestedBranches.filter((b) => b !== baseBranch))];
  }
  const { stdout } = await execFileAsync('git', ['branch', '--format=%(refname:short)'], {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024,
  });
  return stdout
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((b) => b !== baseBranch);
}

export async function loadPullRequestState(): Promise<{
  map: Map<string, PullRequestState>;
  note: string | null;
}> {
  try {
    const { stdout } = await execFileAsync(
      'gh',
      [
        'pr',
        'list',
        '--limit',
        '200',
        '--json',
        'number,title,headRefName,baseRefName,state,isDraft,mergeStateStatus,url',
      ],
      { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10, env: { ...process.env, NO_COLOR: '1' } },
    );
    const prs = JSON.parse(stdout) as PullRequestState[];
    return { map: new Map(prs.map((pr) => [pr.headRefName, pr])), note: null };
  } catch (error) {
    return {
      map: new Map(),
      note: `GitHub PR state unavailable: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function inspectMergeCandidate(
  branch: string,
  baseBranch: string,
  prMap: Map<string, PullRequestState>,
): Promise<AgentMergeCandidate> {
  if (await isAncestor(branch, baseBranch)) {
    return { name: branch, alreadyMerged: true, mergeable: true, pr: prMap.get(branch) ?? null };
  }
  try {
    await execFileAsync('git', ['merge-tree', '--write-tree', baseBranch, branch], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10,
      env: { ...process.env, NO_COLOR: '1' },
    });
    return { name: branch, alreadyMerged: false, mergeable: true, pr: prMap.get(branch) ?? null };
  } catch (error) {
    return {
      name: branch,
      alreadyMerged: false,
      mergeable: false,
      pr: prMap.get(branch) ?? null,
      mergeCheckError: error instanceof Error ? error.message : String(error),
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
