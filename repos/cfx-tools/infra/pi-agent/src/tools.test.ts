import { beforeEach, describe, expect, it, vi } from 'vitest';

const configRuntime = vi.hoisted(() => ({
  readPiConfig: vi.fn(),
  resolveEffectiveActionPolicy: vi.fn(),
}));

const llmAgentsRuntime = vi.hoisted(() => ({
  executePiAction: vi.fn(),
  executePiAgentCheck: vi.fn(),
  executePiCommitWorkflow: vi.fn(),
  getPiActionDefinitions: vi.fn(async () => []),
}));

vi.mock('./config.js', () => ({
  readPiConfig: configRuntime.readPiConfig,
  resolveEffectiveActionPolicy: configRuntime.resolveEffectiveActionPolicy,
}));

vi.mock('./llm-agents-runtime.js', () => ({
  executePiAction: llmAgentsRuntime.executePiAction,
  executePiAgentCheck: llmAgentsRuntime.executePiAgentCheck,
  executePiCommitWorkflow: llmAgentsRuntime.executePiCommitWorkflow,
  getPiActionDefinitions: llmAgentsRuntime.getPiActionDefinitions,
}));

import { registerPiRepoTools } from './tools.js';

function registerToolMap(): Map<string, any> {
  const tools = new Map<string, any>();
  registerPiRepoTools({
    registerTool: vi.fn((tool: any) => {
      tools.set(tool.name, tool);
    }),
  } as never);
  return tools;
}

describe('registerPiRepoTools', () => {
  beforeEach(() => {
    configRuntime.readPiConfig.mockReset();
    configRuntime.resolveEffectiveActionPolicy.mockReset();
    llmAgentsRuntime.executePiAction.mockReset();
    llmAgentsRuntime.executePiAgentCheck.mockReset();
    llmAgentsRuntime.executePiCommitWorkflow.mockReset();
    llmAgentsRuntime.getPiActionDefinitions.mockReset();

    configRuntime.readPiConfig.mockResolvedValue({
      provider: 'litellm',
      baseUrl: null,
      defaultModel: null,
      actions: {},
      providerProfiles: {},
      actionPolicies: {},
      harness: { providerStrategy: 'auto' },
    });
    configRuntime.resolveEffectiveActionPolicy.mockImplementation(
      (_config: unknown, options?: { action?: string; phase?: string }) => ({
        action: options?.action,
        phase: options?.phase,
        source: options?.phase ? 'phase' : 'action',
        legacyActionModel: null,
        model: null,
        profile: {
          name: null,
          exists: false,
          provider: null,
          baseUrl: null,
          defaultModel: null,
          githubModel: null,
          requestTimeoutMs: null,
          providerStrategy: 'auto',
        },
      }),
    );
  });

  it('clears operator widgets instead of pinning a repo action widget', async () => {
    llmAgentsRuntime.getPiActionDefinitions.mockResolvedValue([
      { name: 'review', definition: { title: 'Review changes', mode: 'deterministic' } },
    ]);
    llmAgentsRuntime.executePiAction.mockResolvedValue({
      action: 'review',
      definition: { title: 'Review changes', mode: 'deterministic' },
      executionContext: {
        unit: {
          name: 'delivery',
          rootDir: 'openspec',
          configPath: 'artifacts/llm/config/units/delivery.json',
        },
        llm: {
          used: true,
          status: 'ready',
          configPath: 'artifacts/llm/config/units/delivery.json',
          provider: 'litellm',
          model: 'Qwen3-Coder-Next-GGUF',
        },
      },
      response: { content: 'Review summary' },
    });

    const tools = registerToolMap();
    const ctx = {
      hasUI: true,
      ui: {
        setStatus: vi.fn(),
        setWidget: vi.fn(),
      },
    };

    await tools
      .get('repo_run_action')
      ?.execute('tool-call', { action: 'review' }, undefined, undefined, ctx);

    expect(ctx.ui.setStatus).toHaveBeenCalledWith(
      'repo-action-tool',
      'review · deterministic · Qwen3-Coder-Next-GGUF',
    );
    expect(ctx.ui.setWidget).toHaveBeenCalledWith('repo-agent-workflow', undefined, {
      placement: 'aboveEditor',
    });
    expect(ctx.ui.setWidget.mock.calls.every(([, lines]) => lines === undefined)).toBe(true);
  });

  it('clears operator widgets instead of pinning a commit workflow widget', async () => {
    llmAgentsRuntime.executePiCommitWorkflow.mockResolvedValue({
      command: 'commit',
      status: 'approval-required',
      phase: 'approval',
      executionContext: {
        unit: {
          name: 'implementation',
          rootDir: 'repos',
          configPath: 'artifacts/llm/config/units/implementation.json',
        },
        llm: {
          used: true,
          status: 'ready',
          configPath: 'artifacts/llm/config/units/implementation.json',
          provider: 'litellm',
          model: 'Qwen3-Coder-Next-GGUF',
        },
      },
      repositoryPolicies: {
        label: 'Repository policy gates',
        passed: true,
        skipped: false,
        results: [],
      },
      qualityGates: { label: 'Quality gates', passed: true, skipped: false, results: [] },
      approval: { required: true, approved: false, declined: false },
      failureAnalysis: null,
    });

    const tools = registerToolMap();
    const ctx = {
      hasUI: true,
      ui: {
        setStatus: vi.fn(),
        setWidget: vi.fn(),
      },
    };

    await tools.get('repo_commit_workflow')?.execute('tool-call', {}, undefined, undefined, ctx);

    expect(ctx.ui.setStatus).toHaveBeenCalledWith(
      'repo-commit-tool',
      'commit · approval-required · implementation',
    );
    expect(ctx.ui.setWidget).toHaveBeenCalledWith('repo-agent-commit', undefined, {
      placement: 'aboveEditor',
    });
    expect(ctx.ui.setWidget.mock.calls.every(([, lines]) => lines === undefined)).toBe(true);
  });

  it('surfaces agent check status and planned change names', async () => {
    llmAgentsRuntime.executePiAgentCheck.mockResolvedValue({
      generatedAt: '2026-05-23T00:00:00.000Z',
      status: 'planned',
      executionContext: {
        unit: { name: 'shared-repo', rootDir: '.', configPath: '.pi/providers.json' },
        llm: {
          used: true,
          status: 'ready',
          configPath: '.pi/providers.json',
          provider: 'litellm',
          model: 'Qwen3',
        },
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

    const tools = registerToolMap();
    const ctx = {
      hasUI: true,
      ui: { setStatus: vi.fn(), setWidget: vi.fn() },
    };

    const result = await tools
      .get('repo_agent_check')
      ?.execute('tool-call', { quick: true }, undefined, undefined, ctx);

    expect(llmAgentsRuntime.executePiAgentCheck).toHaveBeenCalledWith({ quick: true });
    expect(result?.content[0].text).toContain('fix-hotspots');
    expect(result?.details.status).toBe('planned');
    expect(result?.details.changes).toEqual(['fix-hotspots']);
    expect(ctx.ui.setStatus).toHaveBeenCalledWith(
      'repo-agent-check-tool',
      expect.stringContaining('agent-check'),
    );
  });
});
