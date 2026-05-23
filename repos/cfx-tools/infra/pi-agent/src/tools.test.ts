import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const configRuntime = vi.hoisted(() => ({
  readPiConfig: vi.fn(),
  resolveEffectiveActionPolicy: vi.fn(),
}));

const llmAgentsRuntime = vi.hoisted(() => ({
  executePiAction: vi.fn(),
  executePiCommitWorkflow: vi.fn(),
  getPiActionDefinitions: vi.fn(async () => []),
}));

vi.mock('./config.js', () => ({
  readPiConfig: configRuntime.readPiConfig,
  resolveEffectiveActionPolicy: configRuntime.resolveEffectiveActionPolicy,
}));

vi.mock('./llm-agents-runtime.js', () => ({
  executePiAction: llmAgentsRuntime.executePiAction,
  executePiCommitWorkflow: llmAgentsRuntime.executePiCommitWorkflow,
  getPiActionDefinitions: llmAgentsRuntime.getPiActionDefinitions,
}));

import { executePiCommitSession, registerPiRepoTools } from './tools.js';

function registerToolMap(): Map<string, any> {
  const tools = new Map<string, any>();
  registerPiRepoTools({
    registerTool: vi.fn((tool: any) => {
      tools.set(tool.name, tool);
    }),
  } as never);
  return tools;
}

describe('executePiCommitSession', () => {
  const originalConfigPath = process.env.CFXDEVKIT_LLM_CONFIG_PATH;

  beforeEach(() => {
    configRuntime.readPiConfig.mockReset();
    configRuntime.resolveEffectiveActionPolicy.mockReset();
    llmAgentsRuntime.executePiCommitWorkflow.mockReset();

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
      (_config, options?: { action?: string; phase?: string }) => ({
        action: options?.action,
        phase: options?.phase,
        source: options?.phase ? 'phase' : 'action',
        legacyActionModel: null,
        model:
          options?.phase === 'failure-analysis'
            ? 'failure-model'
            : options?.phase === 'message-generation'
              ? 'message-model'
              : 'action-model',
        profile: {
          name: 'cloud-strong',
          exists: true,
          provider: 'github-models',
          baseUrl: null,
          defaultModel: 'gpt-4.1',
          githubModel: null,
          requestTimeoutMs: 120000,
          providerStrategy: 'auto',
        },
      }),
    );
    llmAgentsRuntime.executePiCommitWorkflow.mockResolvedValue(null);
  });

  afterEach(() => {
    if (originalConfigPath === undefined) {
      delete process.env.CFXDEVKIT_LLM_CONFIG_PATH;
    } else {
      process.env.CFXDEVKIT_LLM_CONFIG_PATH = originalConfigPath;
    }
  });

  it('derives commit and failure-analysis models from action policies', async () => {
    await executePiCommitSession({ prompt: 'Prepare the commit' });

    expect(llmAgentsRuntime.executePiCommitWorkflow).toHaveBeenCalledWith(['Prepare the commit'], {
      modelPolicies: {
        messageGenerationModel: 'message-model',
        failureAnalysisModel: 'failure-model',
      },
    });
  });

  it('lets an explicit model override both policy-selected models', async () => {
    await executePiCommitSession({ model: 'explicit-model' });

    expect(llmAgentsRuntime.executePiCommitWorkflow).toHaveBeenCalledWith([], {
      modelPolicies: {
        messageGenerationModel: 'explicit-model',
        failureAnalysisModel: 'explicit-model',
      },
    });
  });

  it('applies the commit profile as a temporary scoped config overlay', async () => {
    let observedConfigPath: string | undefined;
    let observedConfig: Record<string, unknown> | null = null;

    llmAgentsRuntime.executePiCommitWorkflow.mockImplementationOnce(async () => {
      observedConfigPath = process.env.CFXDEVKIT_LLM_CONFIG_PATH;
      observedConfig = observedConfigPath
        ? (JSON.parse(await readFile(observedConfigPath, 'utf8')) as Record<string, unknown>)
        : null;
      return null;
    });

    await executePiCommitSession({ prompt: 'Prepare the commit' });

    expect(observedConfigPath).toBeTruthy();
    expect(observedConfig).toMatchObject({
      provider: 'github-models',
      baseUrl: null,
      defaultModel: 'gpt-4.1',
      requestTimeoutMs: 120000,
      harness: {
        providerStrategy: 'auto',
      },
    });
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBe(originalConfigPath);
  });
});

describe('registerPiRepoTools', () => {
  beforeEach(() => {
    configRuntime.readPiConfig.mockReset();
    configRuntime.resolveEffectiveActionPolicy.mockReset();
    llmAgentsRuntime.executePiAction.mockReset();
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
});
