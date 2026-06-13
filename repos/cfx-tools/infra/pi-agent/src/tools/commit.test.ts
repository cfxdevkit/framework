import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const configRuntime = vi.hoisted(() => ({
  readPiConfig: vi.fn(),
  resolveEffectiveActionPolicy: vi.fn(),
}));

const llmAgentsRuntime = vi.hoisted(() => ({
  executePiCommitWorkflow: vi.fn(),
}));

vi.mock('../config.js', () => ({
  readPiConfig: configRuntime.readPiConfig,
  resolveEffectiveActionPolicy: configRuntime.resolveEffectiveActionPolicy,
}));

vi.mock('../llm-agents-runtime.js', () => ({
  executePiCommitWorkflow: llmAgentsRuntime.executePiCommitWorkflow,
}));

import { executePiCommitSession } from './commit.js';

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
      harness: { providerStrategy: 'auto' },
    });
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBe(originalConfigPath);
  });
});
