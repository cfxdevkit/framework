import type { RepoMergeCandidateResult, RepoMergeResult } from './repo/merge.js';

const outcomeIcon: Record<RepoMergeCandidateResult['outcome'], string> = {
  merged: '✓',
  'already-merged': '─',
  'skipped-conflict': '✗',
  'skipped-no-pr': '?',
  failed: '!',
  'dry-run-clean': '○',
  'dry-run-conflict': '✗',
};

export function renderRepoMergeResult(result: RepoMergeResult): string {
  const lines = [
    'cdk repo merge',
    '',
    `Status:         ${result.status.toUpperCase()} (exit ${result.exitCode})`,
    `Base branch:    ${result.baseBranch}`,
    `Dry run:        ${result.dryRun ? 'yes' : 'no'}`,
    `Total:          ${result.summary.total}`,
    `Merged:         ${result.summary.merged}`,
    `Already merged: ${result.summary.alreadyMerged}`,
    `Conflicts:      ${result.summary.conflicts}`,
    `Failed:         ${result.summary.failed}`,
    `Skipped:        ${result.summary.skipped}`,
  ];
  if (result.gitHubNote) lines.push(`GitHub:         ${result.gitHubNote}`);
  lines.push('');
  for (const item of result.results) {
    const icon = outcomeIcon[item.outcome] ?? '·';
    lines.push(`${icon} ${item.branch} [${item.outcome}]`);
    if (item.pr) {
      lines.push(`  PR #${item.pr.number}: ${item.pr.title}`);
      lines.push(`  URL: ${item.pr.url}`);
      if (item.pr.mergeStateStatus) lines.push(`  Merge state: ${item.pr.mergeStateStatus}`);
    }
    if (item.note) lines.push(`  Note: ${item.note}`);
  }
  return lines.join('\n');
}
