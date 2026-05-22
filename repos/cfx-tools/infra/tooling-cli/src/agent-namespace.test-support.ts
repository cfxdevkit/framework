import { vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
  llmClient: {
    configPath: '/workspaces/root/artifacts/llm/config/llm.json',
    defaultConfig: vi.fn(() => ({
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
    getProviderBaseUrl: vi.fn(() => 'http://host.containers.internal:13305/api/v1'),
    getProviderDefaultModel: vi.fn(() => 'Qwen3-Coder-Next-GGUF'),
    resolveProviderModel: vi.fn(async () => 'Qwen3-Coder-Next-GGUF'),
  },
  llmAgents: {
    listActions: vi.fn(() => undefined),
    listModels: vi.fn(async () => undefined),
    runAction: vi.fn(async () => undefined),
    runCommit: vi.fn(async () => undefined),
    runDocsApi: vi.fn(async () => undefined),
    runDocsApiProbe: vi.fn(async () => undefined),
    runDocsPackagePages: vi.fn(async () => undefined),
    runDocsReadme: vi.fn(async () => undefined),
    runDocsUpkeep: vi.fn(async () => undefined),
    runPrecommit: vi.fn(async () => undefined),
    runAll: vi.fn(async () => undefined),
    runReviewAgent: vi.fn(async () => undefined),
    runStructureUpkeep: vi.fn(async () => undefined),
    runTestUpkeep: vi.fn(async () => undefined),
    validateModels: vi.fn(async () => undefined),
    configure: vi.fn(async () => undefined),
  },
  piAgent: {
    runPiCommit: vi.fn(async () => undefined),
    runPiInteractive: vi.fn(async () => undefined),
    runPiPrint: vi.fn(async () => undefined),
    runPiRpc: vi.fn(async () => undefined),
  },
}));

export const llmClient = hoisted.llmClient;
export const llmAgents = hoisted.llmAgents;
export const piAgent = hoisted.piAgent;

vi.mock('./agent-runtime.js', async () => {
  const actual = await vi.importActual<typeof import('./agent-runtime.js')>('./agent-runtime.js');
  return {
    ...actual,
    withLlmClient: async (run: (client: typeof llmClient) => Promise<unknown> | unknown) =>
      await run(llmClient),
    withLlmAgents: async (run: (agents: typeof llmAgents) => Promise<unknown> | unknown) => {
      await run(llmAgents);
    },
    withPiAgent: async (run: (agent: typeof piAgent) => Promise<unknown> | unknown) => {
      await run(piAgent);
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

export function resetAgentNamespaceMocks() {
  vi.restoreAllMocks();
  llmClient.readConfig.mockClear();
  llmClient.resolveNamedProviderProfile.mockClear();
  llmClient.resolveRuntimeBridgeState.mockClear();
  llmClient.writeConfig.mockClear();
  llmClient.resolveProvider.mockClear();
  llmAgents.configure.mockClear();
  llmAgents.runAll.mockClear();
  llmAgents.runDocsApiProbe.mockClear();
  llmAgents.runReviewAgent.mockClear();
  piAgent.runPiCommit.mockClear();
  piAgent.runPiInteractive.mockClear();
  piAgent.runPiPrint.mockClear();
  piAgent.runPiRpc.mockClear();
}