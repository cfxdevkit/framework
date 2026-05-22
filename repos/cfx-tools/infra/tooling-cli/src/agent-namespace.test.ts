import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  llmAgents,
  llmClient,
  piAgent,
  resetAgentNamespaceMocks,
} from './agent-namespace.test-support.ts';

import { agentToolingNamespace } from './agent-namespace.js';

describe('agentToolingNamespace', () => {
  afterEach(() => {
    resetAgentNamespaceMocks();
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
      expect.stringContaining('cdk agent [--scope <unit>] interactive'),
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

    await agentToolingNamespace.run(['config', 'show', 'action-policy', 'commit', 'failure-analysis']);

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
        '/artifacts/llm/config/units/docs.json',
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

    await agentToolingNamespace.run(['config', 'show', '--scope', 'docs']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"defaultMode": "deterministic"'));
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBeUndefined();
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

  it('routes print mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['print', '--', '--quick', 'hello']);

    expect(piAgent.runPiPrint).toHaveBeenCalledWith({ promptArgs: ['--quick', 'hello'] });
  });

  it('routes scoped print mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['--scope', 'docs', 'print', '--', 'hello']);

    expect(piAgent.runPiPrint).toHaveBeenCalledWith({
      scope: 'docs',
      promptArgs: ['hello'],
    });
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBeUndefined();
  });

  it('routes exploratory ask through the pi print runtime', async () => {
    await agentToolingNamespace.run(['exploratory', 'ask', '--quick', 'hello']);

    expect(piAgent.runPiPrint).toHaveBeenCalledWith({ promptArgs: ['--quick', 'hello'] });
  });

  it('routes interactive mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['interactive', 'review']);

    expect(piAgent.runPiInteractive).toHaveBeenCalledWith({ promptArgs: ['review'] });
  });

  it('routes commit mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['commit', 'Focus', 'the', 'docs', 'release']);

    expect(piAgent.runPiCommit).toHaveBeenCalledWith({
      promptArgs: ['Focus', 'the', 'docs', 'release'],
    });
  });

  it('routes scoped rpc mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['--scope', 'docs', 'rpc']);

    expect(piAgent.runPiRpc).toHaveBeenCalledWith({ scope: 'docs' });
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBeUndefined();
  });

  it('routes rpc mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['rpc']);

    expect(piAgent.runPiRpc).toHaveBeenCalledWith({});
  });

  it('routes exploratory all through the current llm-agents aggregate flow', async () => {
    await agentToolingNamespace.run(['exploratory', 'all']);

    expect(llmAgents.runAll).toHaveBeenCalledTimes(1);
  });
});
