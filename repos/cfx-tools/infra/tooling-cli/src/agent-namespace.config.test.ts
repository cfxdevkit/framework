import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resetToolingCliAgentNamespaceHarness,
} from '@cfxdevkit/testing/tooling-cli-test-support';

const harness = vi.hoisted(() => ({
  prompts: {
    input: vi.fn(async () => ''),
    select: vi.fn(async () => ''),
  },
  llmClient: {
    readConfig: vi.fn(async () => ({
      provider: 'litellm',
      baseUrl: null,
      defaultModel: null,
      requestTimeoutMs: 120000,
      actions: {},
      providerProfiles: {},
      actionPolicies: {},
      harness: {
        version: 1,
        defaultMode: 'deterministic',
        providerStrategy: 'auto',
        deterministic: {
          preserveDeterministicArtifacts: true,
          preserveDeterministicSections: true,
        },
        exploratory: {
          allowCodeChanges: true,
          allowWideChanges: true,
        },
      },
    })),
    writeConfig: vi.fn(async () => undefined),
    resolveNamedProviderProfile: vi.fn((config, profileName) => ({
      name: profileName ?? null,
      exists: Boolean(profileName && config.providerProfiles?.[profileName]),
      provider: config.providerProfiles?.[profileName]?.provider ?? config.provider ?? null,
      baseUrl: config.providerProfiles?.[profileName]?.baseUrl ?? config.baseUrl ?? null,
      defaultModel:
        config.providerProfiles?.[profileName]?.defaultModel ?? config.defaultModel ?? null,
      githubModel:
        config.providerProfiles?.[profileName]?.githubModel ?? config.githubModel ?? null,
      requestTimeoutMs:
        config.providerProfiles?.[profileName]?.requestTimeoutMs ?? config.requestTimeoutMs ?? null,
      providerStrategy:
        config.providerProfiles?.[profileName]?.providerStrategy ?? config.harness.providerStrategy,
    })),
    resolveRuntimeBridgeState: vi.fn(async (_scope, options) => ({
      effectivePolicy: {
        action: options?.action,
        phase: options?.phase,
        source: options?.phase ? 'phase' : options?.action ? 'action' : 'default',
        legacyActionModel: null,
        model: 'Qwen3-Coder-Next-GGUF',
        profile: {
          name: options?.phase ? 'cloud-strong' : options?.action ? 'local-fast' : null,
          exists: true,
          provider: options?.phase ? 'github-models' : 'litellm',
          baseUrl: null,
          defaultModel: options?.phase ? 'gpt-4.1' : 'Qwen3-Coder-Next-GGUF',
          githubModel: null,
          requestTimeoutMs: 120000,
          providerStrategy: 'auto',
        },
      },
    })),
    resolveProvider: vi.fn(async () => ({
      type: 'lemonade',
      discoverModels: async () => [{ id: 'Qwen3-Coder-Next-GGUF' }],
      chooseModel: (models: Array<{ id: string }>) => models[0],
    })),
    resolveProviderModel: vi.fn(async () => 'Qwen3-Coder-Next-GGUF'),
    getProviderBaseUrl: vi.fn(async () => 'http://localhost:11434'),
    getProviderDefaultModel: vi.fn(() => 'Qwen3-Coder-Next-GGUF'),
  },
  llmAgents: {
    configure: vi.fn(async () => undefined),
  },
  piAgent: {
    runPiCommit: vi.fn(async () => undefined),
    runPiInteractive: vi.fn(async () => undefined),
    runPiPrint: vi.fn(async () => undefined),
    runPiRpc: vi.fn(async () => undefined),
  },
}));

vi.mock('@inquirer/prompts', () => ({
  input: harness.prompts.input,
  select: harness.prompts.select,
}));

vi.mock('./agent-runtime.js', async () => {
  const actual = await vi.importActual<typeof import('./agent-runtime.js')>('./agent-runtime.js');
  return {
    ...actual,
    withLlmClient: async (run: (client: typeof harness.llmClient) => Promise<unknown> | unknown) =>
      await run(harness.llmClient),
    withLlmAgents: async (run: (agents: typeof harness.llmAgents) => Promise<unknown> | unknown) => {
      await run(harness.llmAgents);
    },
    withPiAgent: async (run: (agent: typeof harness.piAgent) => Promise<unknown> | unknown) => {
      await run(harness.piAgent);
    },
    withAgentScope: async (scope: string | undefined, work: () => Promise<unknown> | unknown) => {
      if (!scope) {
        return await work();
      }

      const previous = process.env.CFXDEVKIT_LLM_CONFIG_PATH;
      process.env.CFXDEVKIT_LLM_CONFIG_PATH = `/workspaces/root/artifacts/llm/config/units/${scope}.json`;
      try {
        return await work();
      } finally {
        if (previous === undefined) {
          delete process.env.CFXDEVKIT_LLM_CONFIG_PATH;
        } else {
          process.env.CFXDEVKIT_LLM_CONFIG_PATH = previous;
        }
      }
    },
  };
});

const { llmAgents, llmClient } = harness;

import { agentToolingNamespace } from './agent-namespace.js';

describe('agentToolingNamespace config and status', () => {
  afterEach(() => {
    resetToolingCliAgentNamespaceHarness(harness);
  });

  it('prints provider guidance that keeps LiteLLM and direct providers', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await agentToolingNamespace.run(['providers']);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Recommendation: keep both LiteLLM and direct providers.'),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('default to auto selection'));
  });

  it('prints the planned command surface in help output', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await agentToolingNamespace.run(['help']);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('cdk agent [--scope <preset>] interactive'),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Commands:'));
  });

  it('prints the shared harness config', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await agentToolingNamespace.run(['config', 'show']);

    expect(llmClient.readConfig).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"defaultMode": "deterministic"'));
  });

  it('updates the shared harness mode', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await agentToolingNamespace.run(['config', 'set', 'mode', 'exploratory']);

    expect(llmClient.writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        harness: expect.objectContaining({
          defaultMode: 'exploratory',
        }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Updated '));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('llm.json'));
  });

  it('delegates provider config updates through the current llm-agents config flow', async () => {
    await agentToolingNamespace.run(['config', 'set', 'provider', 'lemonade']);

    expect(llmAgents.configure).toHaveBeenCalledWith(['set', 'provider', 'lemonade']);
  });

  it('prints backend status including the resolved provider', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await agentToolingNamespace.run(['status']);

    expect(llmClient.resolveProvider).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Resolved backend:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('provider: lemonade'));
  });
});