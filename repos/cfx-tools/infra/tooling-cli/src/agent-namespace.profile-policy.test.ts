import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetToolingCliAgentNamespaceHarness } from './test-support.js';

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
    withLlmAgents: async (
      run: (agents: typeof harness.llmAgents) => Promise<unknown> | unknown,
    ) => {
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

const { llmClient } = harness;

import { agentToolingNamespace } from './agent-namespace.js';

describe('agentToolingNamespace profile and policy config', () => {
  afterEach(() => {
    resetToolingCliAgentNamespaceHarness(harness);
  });

  it('prints configured provider profiles', async () => {
    llmClient.readConfig.mockResolvedValueOnce({
      provider: 'litellm',
      baseUrl: null,
      defaultModel: null,
      requestTimeoutMs: 120000,
      actions: {},
      providerProfiles: {
        'local-fast': {
          provider: 'litellm',
          defaultModel: 'qwen-local',
        },
      },
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
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await agentToolingNamespace.run(['config', 'show', 'profiles']);

    expect(llmClient.resolveNamedProviderProfile).toHaveBeenCalledWith(
      expect.objectContaining({ providerProfiles: expect.any(Object) }),
      'local-fast',
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Configured provider profiles:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('local-fast'));
  });

  it('prints the effective action policy for an action phase', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await agentToolingNamespace.run([
      'config',
      'show',
      'action-policy',
      'commit',
      'failure-analysis',
    ]);

    expect(llmClient.resolveRuntimeBridgeState).toHaveBeenCalledWith(undefined, {
      action: 'commit',
      phase: 'failure-analysis',
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Effective policy:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cloud-strong'));
  });

  it('updates a named provider profile', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await agentToolingNamespace.run(['config', 'set', 'profile-provider', 'local-fast', 'litellm']);

    expect(llmClient.writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        providerProfiles: expect.objectContaining({
          'local-fast': expect.objectContaining({ provider: 'litellm' }),
        }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Updated '));
  });

  it('updates an action policy binding', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await agentToolingNamespace.run(['config', 'set', 'action-policy', 'review', 'local-fast']);

    expect(llmClient.writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        actionPolicies: expect.objectContaining({
          review: expect.objectContaining({ profile: 'local-fast' }),
        }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Updated '));
  });

  it('applies scoped config commands through the selected monorepo overlay', async () => {
    llmClient.readConfig.mockImplementationOnce(async () => {
      expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toContain(
        '/artifacts/llm/config/units/delivery.json',
      );
      return {
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
      };
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await agentToolingNamespace.run(['config', 'show', '--scope', 'delivery']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"defaultMode": "deterministic"'));
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBeUndefined();
  });
});
