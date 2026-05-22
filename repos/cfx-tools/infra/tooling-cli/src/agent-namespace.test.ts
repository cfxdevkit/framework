import { afterEach, describe, expect, it, vi } from 'vitest';

const llmClient = vi.hoisted(() => ({
  configPath: '/workspaces/root/artifacts/llm/config/llm.json',
  defaultConfig: vi.fn(() => ({
    provider: 'litellm',
    baseUrl: null,
    defaultModel: null,
    requestTimeoutMs: 120000,
    actions: {},
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
  resolveProvider: vi.fn(async () => ({
    type: 'lemonade',
    discoverModels: async () => [{ id: 'Qwen3-Coder-Next-GGUF' }],
    chooseModel: (models) => models[0],
  })),
  getProviderBaseUrl: vi.fn(() => 'http://host.containers.internal:13305/api/v1'),
  getProviderDefaultModel: vi.fn(() => 'Qwen3-Coder-Next-GGUF'),
  resolveProviderModel: vi.fn(async () => 'Qwen3-Coder-Next-GGUF'),
}));

const llmAgents = vi.hoisted(() => ({
  ask: vi.fn(async () => undefined),
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
}));

vi.mock('../../llm-client/src/index.js', () => llmClient);
vi.mock('../../llm-agents/src/index.js', () => llmAgents);

import { agentToolingNamespace } from './agent-namespace.js';

describe('agentToolingNamespace', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    llmClient.readConfig.mockClear();
    llmClient.writeConfig.mockClear();
    llmClient.resolveProvider.mockClear();
    llmAgents.ask.mockClear();
    llmAgents.configure.mockClear();
    llmAgents.runAll.mockClear();
    llmAgents.runDocsApiProbe.mockClear();
    llmAgents.runReviewAgent.mockClear();
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

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cdk agent interactive'));
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

  it('routes constrained workflows through the deterministic command surface', async () => {
    await agentToolingNamespace.run(['deterministic', 'docs-api-probe', '--quick']);

    expect(llmAgents.runDocsApiProbe).toHaveBeenCalledWith(['--quick']);
  });

  it('routes print mode through the existing ask flow', async () => {
    await agentToolingNamespace.run(['print', '--', '--quick', 'hello']);

    expect(llmAgents.ask).toHaveBeenCalledWith(['--quick', 'hello']);
  });

  it('routes interactive mode through the configured default mode', async () => {
    llmClient.readConfig.mockResolvedValueOnce({
      provider: 'litellm',
      baseUrl: null,
      defaultModel: null,
      requestTimeoutMs: 120000,
      actions: {},
      harness: {
        version: 1,
        defaultMode: 'exploratory',
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

    await agentToolingNamespace.run(['interactive', 'review']);

    expect(llmAgents.runReviewAgent).toHaveBeenCalledTimes(1);
  });

  it('routes exploratory all through the current llm-agents aggregate flow', async () => {
    await agentToolingNamespace.run(['exploratory', 'all']);

    expect(llmAgents.runAll).toHaveBeenCalledTimes(1);
  });
});