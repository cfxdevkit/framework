import { describe, expect, it } from 'vitest';
import { parseAgentMergeFlags, renderAgentMergeReport } from './agent-merge.js';

describe('parseAgentMergeFlags', () => {
  it('parses dry-run, base branch, and explicit branch arguments', () => {
    expect(parseAgentMergeFlags(['--dry-run', '--base', 'main', 'opsx/repo-check-fixes'])).toEqual({
      dryRun: true,
      base: 'main',
      branches: ['opsx/repo-check-fixes'],
    });
  });
});

describe('renderAgentMergeReport', () => {
  it('renders candidate branch mergeability and PR details', () => {
    const rendered = renderAgentMergeReport({
      baseBranch: 'main',
      dryRun: true,
      gitHubStatusNote: 'GitHub PR state unavailable: gh auth login required',
      candidates: [
        {
          name: 'opsx/repo-check-fixes',
          alreadyMerged: false,
          mergeable: true,
          pr: {
            number: 12,
            title: 'Plan repo check remediation',
            headRefName: 'opsx/repo-check-fixes',
            baseRefName: 'main',
            state: 'OPEN',
            isDraft: true,
            mergeStateStatus: 'CLEAN',
            url: 'https://github.com/example/repo/pull/12',
          },
        },
      ],
      mergedBranches: [],
    });

    expect(rendered).toContain('Base branch: main');
    expect(rendered).toContain('opsx/repo-check-fixes: mergeable');
    expect(rendered).toContain('Plan repo check remediation');
    expect(rendered).toContain('GitHub PR state unavailable');
  });
});