import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const llmAgents = vi.hoisted(() => ({
  runCommit: vi.fn(async () => undefined),
  runPrecommit: vi.fn(async () => undefined),
  runReviewAgent: vi.fn(async () => undefined),
}));

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock('../../llm-agents/src/index.js', () => llmAgents);

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
      expect.stringContaining('check <hotspots|docs|ci|secrets|corpus|eval>'),
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

  it('routes review through the current llm-agents review worker', async () => {
    await repoToolingNamespace.run(['review']);

    expect(llmAgents.runReviewAgent).toHaveBeenCalledTimes(1);
  });

  it('routes precommit through the current llm-agents precommit worker', async () => {
    await repoToolingNamespace.run(['precommit', '--force']);

    expect(llmAgents.runPrecommit).toHaveBeenCalledWith(['--force']);
  });

  it('routes commit through the current llm-agents commit worker', async () => {
    await repoToolingNamespace.run(['commit', '--dry-run']);

    expect(llmAgents.runCommit).toHaveBeenCalledWith(['--dry-run']);
  });
});