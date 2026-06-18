import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetToolingCliAgentNamespaceHarness, withMockedTty } from '../test-support.js';

const harness = vi.hoisted(() => ({
  prompts: {
    input: vi.fn(async () => ''),
    select: vi.fn(async () => ''),
  },
  llmClient: {
    readConfig: vi.fn(async () => ({
      provider: 'openai-compat',
      baseUrl: 'http://localhost:28787/v1/',
      defaultModel: 'Qwen3.6-35B-A3B-MTP-GGUF-Q8_0',
      githubModel: null,
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

vi.mock('./runtime.js', async () => {
  const actual = await vi.importActual<typeof import('./runtime.js')>('./runtime.js');
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

import { agentToolingNamespace } from './namespace.js';

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

    // print mode uses the runtime directly without scope overlay
    expect(piAgent.runPiPrint).toHaveBeenCalledWith({ promptArgs: ['hello'] });
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBeUndefined();
  });

  it('routes exploratory workflows through the llm-agents layer', async () => {
    await agentToolingNamespace.run(['exploratory', 'ask', '--quick', 'hello']);

    expect(llmAgents.runAll).toHaveBeenCalledTimes(1);
  });

  it('routes interactive chat mode through the pi runtime without prompts', async () => {
    await agentToolingNamespace.run(['chat', 'review']);

    expect(piAgent.runPiInteractive).toHaveBeenCalledWith({ promptArgs: ['review'] });
    expect(prompts.select).not.toHaveBeenCalled();
    expect(prompts.input).not.toHaveBeenCalled();
  });

  it('routes chat with --endpoint override through the pi runtime', async () => {
    await agentToolingNamespace.run(['chat', '--endpoint', 'http://custom:1234/v1/', 'review']);

    expect(piAgent.runPiInteractive).toHaveBeenCalledWith({ promptArgs: ['review'] });
  });

  it('routes interactive chat without arguments through the pi runtime', async () => {
    await agentToolingNamespace.run(['chat']);

    expect(piAgent.runPiInteractive).toHaveBeenCalledWith({});
    expect(prompts.select).not.toHaveBeenCalled();
    expect(prompts.input).not.toHaveBeenCalled();
  });

  it('routes commit mode through the pi runtime', async () => {
    await agentToolingNamespace.run(['commit', 'Focus', 'the', 'docs', 'release']);

    expect(piAgent.runPiCommit).toHaveBeenCalledWith({
      promptArgs: [
        'Start an interactive repository commit session.Run /repo-commit to begin the commit workflow inside PI.Inspect repository-policy quality-gate status, keep session open for remediation.Use shared repository workflows to stay in PI session while issues are resolved.\n\nOperator context: Focus the docs release',
      ],
    });
    expect(prompts.input).not.toHaveBeenCalled();
  });

  it('skips interactive prompts when no TTY is available', async () => {
    await withMockedTty(
      async () => {
        await agentToolingNamespace.run(['commit']);
      },
      { stdin: false, stdout: false },
    );

    expect(prompts.select).not.toHaveBeenCalled();
    expect(prompts.input).not.toHaveBeenCalled();
    expect(piAgent.runPiCommit).toHaveBeenCalled();
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

  it('prints endpoint guidance with local launch commands', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      await agentToolingNamespace.run(['endpoints']);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cdk agent endpoints'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('chat [prompt]'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('chat --endpoint'));
    } finally {
      logSpy.mockRestore();
    }
  });
});
