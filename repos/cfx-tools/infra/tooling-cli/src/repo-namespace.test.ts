import { beforeEach, describe, expect, it, vi } from 'vitest';

const llmAgents = vi.hoisted(() => ({
  runCommit: vi.fn(async () => undefined),
  runPrecommit: vi.fn(async () => undefined),
  runReviewAgent: vi.fn(async () => undefined),
}));

const repoCheckMocks = vi.hoisted(() => ({
  runRepoCheck: vi.fn(async (_target: string, _args: string[]) => ({
    kind: 'repo-structured',
    command: {
      namespace: 'repo',
      action: 'check',
      target: 'hotspots',
      script: 'check:hotspots',
      args: [],
      outputMode: 'text',
    },
    context: {
      workspaceRoot: '.',
      requestedFrom: '.',
      metadataRoot: 'artifacts/llm/repo-check',
      generatedAt: new Date().toISOString(),
      gitNexus: null,
    },
    artifacts: {
      reportPath: 'artifacts/llm/repo-check/checks/hotspots.json',
      workspaceNodePath: '',
    },
    status: 'ok',
    exitCode: 0,
    summary: { scannedFiles: 0, hardViolations: 0, softWarnings: 0 },
    report: {
      policy: {
        source: 'test',
        softFileLineLimit: 250,
        hardFileLineLimit: 300,
        churnWindow: '90 days ago',
      },
      hotspots: [],
      hardViolations: [],
      softWarnings: [],
    },
  })),
  runRepoCommand: vi.fn(async (_target: string, _args: string[]) => ({
    kind: 'repo-structured',
    command: {
      namespace: 'repo',
      action: 'command',
      target: 'lint',
      script: 'lint',
      args: [],
      outputMode: 'text',
    },
    context: {
      workspaceRoot: '.',
      requestedFrom: '.',
      metadataRoot: 'artifacts/llm/repo-check',
      generatedAt: new Date().toISOString(),
      gitNexus: null,
    },
    artifacts: { reportPath: 'artifacts/llm/repo-check/commands/lint.json', workspaceNodePath: '' },
    status: 'ok',
    exitCode: 0,
    summary: { durationMs: 100, stdoutLineCount: 1, stderrLineCount: 0 },
    result: { stdoutTail: ['ok'], stderrTail: [] },
  })),
  renderRepoResult: vi.fn(async (_result: unknown, _format: string) => 'ok'),
}));

vi.mock('./repo-check-runtime.js', () => repoCheckMocks);

vi.mock('./agent-runtime.js', async () => {
  const actual = await vi.importActual<typeof import('./agent-runtime.js')>('./agent-runtime.js');
  return {
    ...actual,
    withLlmAgents: async (run: (agents: typeof llmAgents) => Promise<unknown> | unknown) => {
      await run(llmAgents);
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

import { repoToolingNamespace } from './repo-namespace.js';

describe('repoToolingNamespace', () => {
  beforeEach(() => {
    process.exitCode = 0;
    llmAgents.runCommit.mockClear();
    llmAgents.runPrecommit.mockClear();
    llmAgents.runReviewAgent.mockClear();
    repoCheckMocks.runRepoCheck.mockClear();
    repoCheckMocks.runRepoCommand.mockClear();
    repoCheckMocks.renderRepoResult.mockClear();
  });

  it('prints repo help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await repoToolingNamespace.run(['help']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cdk repo'));
    // New surface: build + run are top-level commands
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cdk repo build'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cdk repo run'));
  });

  it('routes hotspot checks through the structured layer', async () => {
    await repoToolingNamespace.run(['check', 'hotspots']);

    expect(repoCheckMocks.runRepoCheck).toHaveBeenCalledWith('hotspots', []);
  });

  it('routes kebab-group checks through the structured layer', async () => {
    await repoToolingNamespace.run(['check', 'kebab-groups']);

    expect(repoCheckMocks.runRepoCheck).toHaveBeenCalledWith('kebab-groups', []);
  });

  it('routes unit-config checks through the structured layer', async () => {
    await repoToolingNamespace.run(['check', 'unit-configs']);

    expect(repoCheckMocks.runRepoCheck).toHaveBeenCalledWith('unit-configs', []);
  });

  it('routes docs check through runRepoCommand', async () => {
    await repoToolingNamespace.run(['check', 'docs']);

    expect(repoCheckMocks.runRepoCommand).toHaveBeenCalledWith('check-docs', []);
  });

  it('routes arch-check through runRepoCommand', async () => {
    await repoToolingNamespace.run(['arch-check']);

    expect(repoCheckMocks.runRepoCommand).toHaveBeenCalledWith('arch-check', []);
  });

  it('routes cdk repo run through runRepoCommand', async () => {
    await repoToolingNamespace.run(['run', 'lint']);

    expect(repoCheckMocks.runRepoCommand).toHaveBeenCalledWith('lint', []);
  });

  it('routes build through runRepoCommand', async () => {
    await repoToolingNamespace.run(['build']);

    expect(repoCheckMocks.runRepoCommand).toHaveBeenCalledWith('build', []);
  });

  it('routes review through the current llm-agents review worker', async () => {
    await repoToolingNamespace.run(['review']);

    expect(llmAgents.runReviewAgent).toHaveBeenCalledTimes(1);
  });

  it('routes precommit through the current llm-agents precommit worker', async () => {
    await repoToolingNamespace.run(['precommit', '--force']);

    expect(llmAgents.runPrecommit).toHaveBeenCalledWith(['--force']);
  });

  it('lists the registered monorepo units', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await repoToolingNamespace.run(['units']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Registered session presets:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('delivery'));
  });

  it('routes scoped precommit through the selected unit overlay', async () => {
    delete process.env.CFXDEVKIT_LLM_CONFIG_PATH;

    llmAgents.runPrecommit.mockImplementationOnce(async () => {
      expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toContain(
        '/artifacts/llm/config/units/implementation.json',
      );
    });

    await repoToolingNamespace.run(['precommit', '--scope', 'implementation', '--force']);

    expect(llmAgents.runPrecommit).toHaveBeenCalledWith(['--force']);
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBeUndefined();
  });

  it('routes commit through the current llm-agents commit worker', async () => {
    await repoToolingNamespace.run(['commit', '--dry-run']);

    expect(llmAgents.runCommit).toHaveBeenCalledWith(['--dry-run']);
  });
});
