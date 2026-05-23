import { beforeEach, describe, expect, it, vi } from 'vitest';

const agentCheckMocks = vi.hoisted(() => ({
  executePiAgentCheck: vi.fn(),
}));

vi.mock('./llm-agents-runtime.js', () => ({
  getPiActionDefinitions: vi.fn(async () => []),
  executePiAgentCheck: agentCheckMocks.executePiAgentCheck,
}));

vi.mock('./providers.js', () => ({
  createPiProviderBridge: vi.fn().mockResolvedValue({
    scope: 'shared-repo',
    providerType: 'litellm',
    providerStrategy: 'auto',
    configPath: '/workspaces/root/.pi/providers.json',
    defaultModel: 'Qwen3',
    pi: { provider: 'litellm', model: 'Qwen3', baseUrl: null, apiKeyEnv: null },
  }),
}));

vi.mock('./tools.js', () => ({
  executePiRepoAction: vi.fn(),
  executePiCommitSession: vi.fn(),
}));

import { registerPiRepoCommands } from './commands.js';

describe('registerPiRepoCommands — repo-check', () => {
  beforeEach(() => {
    agentCheckMocks.executePiAgentCheck.mockReset();
  });

  it('writes agent check results into the session stream', async () => {
    const commands = new Map<string, (args: string, ctx: any) => Promise<void>>();
    const sendMessage = vi.fn();
    registerPiRepoCommands({
      registerCommand: vi.fn(
        (name: string, options: { handler: (args: string, ctx: any) => Promise<void> }) => {
          commands.set(name, options.handler);
        },
      ),
      registerMessageRenderer: vi.fn(),
      sendMessage,
    } as never);

    agentCheckMocks.executePiAgentCheck.mockResolvedValue({
      generatedAt: '2026-05-23T00:00:00.000Z',
      status: 'planned',
      executionContext: {
        unit: { name: 'shared-repo' },
        llm: { provider: 'litellm', model: 'Qwen3' },
      },
      validation: {
        status: 'error',
        summary: { totalSteps: 8, passed: 7, warnings: 0, errors: 1 },
        actionableSteps: [
          {
            id: 'hotspots',
            status: 'error',
            summary: '2 hard violations',
            command: 'pnpm cdk repo check hotspots',
          },
        ],
      },
      plan: {
        summary: 'Fix hotspots',
        changes: [],
        branch: { name: 'opsx/fix', title: 'Fix' },
        handoff: { cloudPromptLines: [], notes: [] },
      },
      artifacts: [
        {
          name: 'fix-hotspots',
          proposalPath: 'openspec/changes/fix-hotspots/proposal.md',
          designPath: 'openspec/changes/fix-hotspots/design.md',
          specPaths: [],
          tasksPath: 'openspec/changes/fix-hotspots/tasks.md',
        },
      ],
      followUp: {
        branch: { requested: false, name: null, status: 'skipped' },
        draftPr: { requested: false, status: 'skipped' },
      },
      dryRun: false,
    });

    const ctx = {
      hasUI: true,
      ui: {
        setStatus: vi.fn(),
        setWidget: vi.fn(),
        notify: vi.fn(),
        setWorkingVisible: vi.fn(),
        setWorkingMessage: vi.fn(),
      },
    };

    await commands.get('repo-check')?.('--quick', ctx);

    expect(agentCheckMocks.executePiAgentCheck).toHaveBeenCalledWith({
      dryRun: false,
      createBranch: false,
      quick: true,
    });
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: 'repo-agent-summary',
        content: 'Agent check',
        details: expect.objectContaining({
          tone: 'info',
          lines: expect.arrayContaining(['status: planned', '- fix-hotspots']),
        }),
      }),
    );
    expect(ctx.ui.setWorkingVisible).toHaveBeenNthCalledWith(1, true);
    expect(ctx.ui.setWorkingVisible).toHaveBeenLastCalledWith(false);
    expect(ctx.ui.notify).not.toHaveBeenCalled();
  });
});
