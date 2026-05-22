import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const llmAgents = vi.hoisted(() => ({
  runCommit: vi.fn(async () => undefined),
  runPrecommit: vi.fn(async () => undefined),
  runReviewAgent: vi.fn(async () => undefined),
}));

const spawnMock = vi.hoisted(() => vi.fn());

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

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}));

import { repoToolingNamespace } from './repo-namespace.js';

function createChild(exitCode = 0): EventEmitter {
  const child = new EventEmitter();
  queueMicrotask(() => child.emit('exit', exitCode, null));
  return child;
}

describe('repoToolingNamespace', () => {
  beforeEach(() => {
    process.exitCode = 0;
    llmAgents.runCommit.mockClear();
    llmAgents.runPrecommit.mockClear();
    llmAgents.runReviewAgent.mockClear();
    spawnMock.mockReset();
    spawnMock.mockImplementation(() => createChild());
  });

  it('prints repo help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await repoToolingNamespace.run(['help']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cdk repo'));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'check <hotspots|kebab-groups|unit-configs|docs|ci|secrets|corpus|eval>',
      ),
    );
  });

  it('routes check commands through root scripts', async () => {
    await repoToolingNamespace.run(['check', 'hotspots']);

    expect(spawnMock).toHaveBeenCalledWith(
      'pnpm',
      ['run', 'check:hotspots'],
      expect.objectContaining({ stdio: 'inherit' }),
    );
  });

  it('routes kebab-group checks through the root script', async () => {
    await repoToolingNamespace.run(['check', 'kebab-groups']);

    expect(spawnMock).toHaveBeenCalledWith(
      'pnpm',
      ['run', 'check:kebab-groups'],
      expect.objectContaining({ stdio: 'inherit' }),
    );
  });

  it('routes unit-config checks through the root script', async () => {
    await repoToolingNamespace.run(['check', 'unit-configs']);

    expect(spawnMock).toHaveBeenCalledWith(
      'pnpm',
      ['run', 'check:unit-configs'],
      expect.objectContaining({ stdio: 'inherit' }),
    );
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

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Registered monorepo units:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('docs'));
  });

  it('routes scoped precommit through the selected unit overlay', async () => {
    llmAgents.runPrecommit.mockImplementationOnce(async () => {
      expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toContain(
        '/artifacts/llm/config/units/repos.json',
      );
    });

    await repoToolingNamespace.run(['precommit', '--scope', 'repos', '--force']);

    expect(llmAgents.runPrecommit).toHaveBeenCalledWith(['--force']);
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBeUndefined();
  });

  it('routes commit through the current llm-agents commit worker', async () => {
    await repoToolingNamespace.run(['commit', '--dry-run']);

    expect(llmAgents.runCommit).toHaveBeenCalledWith(['--dry-run']);
  });
});
