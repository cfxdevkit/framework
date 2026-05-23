import {
  resetToolingCliAgentNamespaceHarness,
  withMockedTty,
} from '@cfxdevkit/testing/tooling-cli-test-support';
import { afterEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  prompts: {
    input: vi.fn(async () => ''),
    select: vi.fn(async () => ''),
  },
  llmClient: {
    readConfig: vi.fn(async () => ({
      provider: 'lemonade',
      baseUrl: 'http://host.containers.internal:13305/',
      defaultModel: 'Qwen3-Coder-Next-GGUF',
      githubModel: 'gpt-4.1',
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
  },
  llmAgents: {
    runAll: vi.fn(async () => undefined),
    runAgentCheck: vi.fn(async () => undefined),
    runDocsApiProbe: vi.fn(async () => undefined),
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
    withPiAgentSource: async (
      run: (agent: typeof harness.piAgent) => Promise<unknown> | unknown,
    ) => {
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

const { llmAgents, piAgent, prompts } = harness;

import { agentToolingNamespace } from './agent-namespace.js';

describe('agentToolingNamespace runtime flows', () => {
  afterEach(() => {
    resetToolingCliAgentNamespaceHarness(harness);
  });

  it('routes constrained workflows through the deterministic command surface', async () => {
    await agentToolingNamespace.run(['deterministic', 'docs-api-probe', '--quick']);

    expect(llmAgents.runDocsApiProbe).toHaveBeenCalledWith(['--quick']);
  });

  it('routes agent check through the dedicated planning worker', async () => {
    await agentToolingNamespace.run(['check', '--quick', '--dry-run']);

    expect(llmAgents.runAgentCheck).toHaveBeenCalledWith(['--quick', '--dry-run']);
  });

  it('routes print mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['print', '--', '--quick', 'hello']);

    expect(piAgent.runPiPrint).toHaveBeenCalledWith({ promptArgs: ['--quick', 'hello'] });
  });

  it('routes scoped print mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['--scope', 'delivery', 'print', '--', 'hello']);

    expect(piAgent.runPiPrint).toHaveBeenCalledWith({
      scope: 'delivery',
      promptArgs: ['hello'],
    });
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBeUndefined();
  });

  it('routes exploratory ask through the pi print runtime', async () => {
    await agentToolingNamespace.run(['exploratory', 'ask', '--quick', 'hello']);

    expect(piAgent.runPiPrint).toHaveBeenCalledWith({ promptArgs: ['--quick', 'hello'] });
  });

  it('routes interactive mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['chat', 'review']);

    expect(piAgent.runPiInteractive).toHaveBeenCalledWith({ promptArgs: ['review'] });
    expect(prompts.select).not.toHaveBeenCalled();
  });

  it('routes GitHub interactive mode through the pi runtime with endpoint override flags removed from the prompt', async () => {
    const previousToken = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = 'test-token';

    try {
      await agentToolingNamespace.run(['chat', '--github', 'review']);
    } finally {
      if (previousToken === undefined) {
        delete process.env.GITHUB_TOKEN;
      } else {
        process.env.GITHUB_TOKEN = previousToken;
      }
    }

    expect(piAgent.runPiInteractive).toHaveBeenCalledWith({ promptArgs: ['review'] });
  });

  it('routes commit mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['commit', 'Focus', 'the', 'docs', 'release']);

    expect(piAgent.runPiCommit).toHaveBeenCalledWith({
      promptArgs: ['Focus', 'the', 'docs', 'release'],
    });
    expect(prompts.input).not.toHaveBeenCalled();
  });

  it('runs setup prompts before starting an interactive PI session when no prompt text is provided', async () => {
    prompts.select.mockResolvedValueOnce('local');
    prompts.select.mockResolvedValueOnce('delivery');
    prompts.input.mockResolvedValueOnce('review the docs backlog');

    await withMockedTty(async () => {
      await agentToolingNamespace.run(['chat']);
    });

    expect(prompts.select).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        message: 'Session endpoint (local planning or GitHub implementation)',
      }),
      expect.objectContaining({ clearPromptOnDone: true }),
    );
    expect(prompts.select).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ message: 'Session preset (shared default or targeted preload)' }),
      expect.objectContaining({ clearPromptOnDone: true }),
    );
    expect(prompts.input).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Session prompt or context for delivery preset on local endpoint (optional)',
      }),
      expect.objectContaining({ clearPromptOnDone: true }),
    );
    expect(piAgent.runPiInteractive).toHaveBeenCalledWith({
      scope: 'delivery',
      promptArgs: ['review the docs backlog'],
    });
  });

  it('skips setup prompts in non-interactive terminals', async () => {
    await withMockedTty(
      async () => {
        await agentToolingNamespace.run(['commit']);
      },
      { stdin: false, stdout: false },
    );

    expect(prompts.select).not.toHaveBeenCalled();
    expect(prompts.input).not.toHaveBeenCalled();
    expect(piAgent.runPiCommit).toHaveBeenCalledWith({});
  });

  it('routes scoped rpc mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['--scope', 'docs', 'rpc']);

    expect(piAgent.runPiRpc).toHaveBeenCalledWith({ scope: 'docs' });
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBeUndefined();
  });

  it('routes scoped local rpc mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['--scope', 'docs', 'rpc', '--local']);

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

  it('prints endpoint guidance with GitHub and local launch commands', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      await agentToolingNamespace.run(['endpoints']);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cdk agent endpoints'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('chat --local'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('chat --github'));
    } finally {
      logSpy.mockRestore();
    }
  });
});
