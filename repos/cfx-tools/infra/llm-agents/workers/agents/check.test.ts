import { describe, expect, it } from 'vitest';
import {
  normalizeAgentCheckPlan,
  parseAgentCheckFlags,
  renderAgentCheckConsoleSummary,
  renderAgentCheckReport,
} from './check.ts';

describe('parseAgentCheckFlags', () => {
  it('supports quick dry-run planning mode', () => {
    expect(parseAgentCheckFlags(['--quick', '--dry-run'])).toEqual({
      quick: true,
      dryRun: true,
      createBranch: false,
      draftPr: false,
    });
  });

  it('treats no-write as dry-run', () => {
    expect(parseAgentCheckFlags(['--no-write'])).toEqual({
      quick: false,
      dryRun: true,
      createBranch: false,
      draftPr: false,
    });
  });

  it('treats draft-pr as implying branch creation', () => {
    expect(parseAgentCheckFlags(['--draft-pr'])).toEqual({
      quick: false,
      dryRun: false,
      createBranch: true,
      draftPr: true,
    });
  });
});

describe('normalizeAgentCheckPlan', () => {
  it('normalizes a structured planner response into stable change and handoff data', () => {
    const plan = normalizeAgentCheckPlan(
      JSON.stringify({
        summary: 'Plan the current repo-check failures.',
        changes: [
          {
            name: 'Fix Repo Check Noise',
            title: 'Fix repo check noise',
            rationale: 'Separate malformed artifacts and lint failures from structural cleanup.',
            issues: [
              'format fails on malformed artifact output',
              'lint fails in scaffold template',
            ],
          },
        ],
        branch: {
          name: 'opsx/repo-check-handoff',
          title: 'Plan repo check remediation',
          bodyLines: ['OpenSpec planning only.', 'Cloud implementation follows this PR.'],
        },
        handoff: {
          cloudPromptLines: ['Implement only the attached change.'],
          notes: ['Keep planning and implementation separate.'],
        },
      }),
    );

    expect(plan.changes[0]?.name).toBe('fix-repo-check-noise');
    expect(plan.branch.name).toBe('opsx/repo-check-handoff');
    expect(plan.handoff.cloudPromptLines).toContain('Implement only the attached change.');
  });
});

describe('renderAgentCheckReport', () => {
  it('renders a concise handoff report with branch and artifact sections', () => {
    const rendered = renderAgentCheckReport({
      generatedAt: '2026-05-23T00:00:00.000Z',
      status: 'planned',
      command: {
        command: 'pnpm cdk repo check',
        exitCode: 1,
        artifactPath: 'artifacts/llm/repo-check/checks/validation.json',
      },
      validation: {
        status: 'error',
        summary: { totalSteps: 8, passed: 3, warnings: 1, errors: 4 },
        actionableSteps: [],
      },
      plan: {
        summary: 'Split the findings into contained remediation changes.',
        changes: [
          {
            name: 'fix-repo-check-noise',
            title: 'Fix repo check noise',
            rationale: 'Stabilize repo-check before deeper cleanups.',
            issues: ['format failure', 'lint failure'],
          },
        ],
        branch: {
          name: 'opsx/repo-check-handoff',
          title: 'Plan repo check remediation',
          bodyLines: ['OpenSpec planning only.'],
        },
        handoff: {
          cloudPromptLines: ['Implement only the planned OpenSpec changes.'],
          notes: ['Use the artifacts to constrain cloud implementation.'],
        },
      },
      artifacts: [
        {
          name: 'fix-repo-check-noise',
          proposalPath: 'openspec/changes/fix-repo-check-noise/proposal.md',
          designPath: 'openspec/changes/fix-repo-check-noise/design.md',
          specPaths: ['openspec/changes/fix-repo-check-noise/specs/fix-repo-check-noise/spec.md'],
          tasksPath: 'openspec/changes/fix-repo-check-noise/tasks.md',
        },
      ],
      followUp: {
        branch: {
          requested: true,
          name: 'opsx/repo-check-handoff',
          status: 'created',
        },
        draftPr: {
          requested: true,
          status: 'created',
          url: 'https://github.com/example/repo/pull/1',
        },
      },
      dryRun: false,
    });

    expect(rendered).toContain('## Handoff Branch');
    expect(rendered).toContain('opsx/repo-check-handoff');
    expect(rendered).toContain('openspec/changes/fix-repo-check-noise/proposal.md');
    expect(rendered).toContain('Draft PR URL: https://github.com/example/repo/pull/1');
  });
});

describe('renderAgentCheckConsoleSummary', () => {
  it('foregrounds branch status, artifacts, and report paths without dumping raw JSON', () => {
    const rendered = renderAgentCheckConsoleSummary({
      status: 'planned',
      executionContext: {
        unit: null,
        llm: {
          status: 'ready',
          configPath: '.pi/providers.json',
          provider: 'lemonade',
          model: 'Qwen3-Coder-Next-GGUF',
          baseUrl: 'http://host.containers.internal:13305/',
        },
      },
      validation: {
        summary: { totalSteps: 8, passed: 3, warnings: 1, errors: 4 },
      },
      plan: {
        changes: [{ name: 'fix-repo-check-noise' }],
        branch: { name: 'opsx/repo-check-handoff' },
      },
      artifacts: [
        {
          name: 'fix-repo-check-noise',
          proposalPath: 'openspec/changes/fix-repo-check-noise/proposal.md',
          designPath: 'openspec/changes/fix-repo-check-noise/design.md',
          specPaths: ['openspec/changes/fix-repo-check-noise/specs/fix-repo-check-noise/spec.md'],
          tasksPath: 'openspec/changes/fix-repo-check-noise/tasks.md',
        },
      ],
      followUp: {
        branch: {
          requested: true,
          name: 'opsx/repo-check-handoff',
          status: 'created',
        },
        draftPr: {
          requested: false,
          status: 'skipped',
        },
      },
      dryRun: false,
    });

    expect(rendered).toContain('Branch: opsx/repo-check-handoff (created)');
    expect(rendered).toContain('openspec/changes/fix-repo-check-noise/proposal.md');
    expect(rendered).toContain('artifacts/llm/reports/agent-check.md');
    expect(rendered).not.toContain('{"status"');
  });
});
