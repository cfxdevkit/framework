import { beforeEach, describe, expect, it, vi } from 'vitest';

const agentNamespace = vi.hoisted(() => ({
  run: vi.fn(async () => undefined),
}));

const repoNamespace = vi.hoisted(() => ({
  run: vi.fn(async () => undefined),
}));

vi.mock('./agent-namespace.js', () => ({
  agentToolingNamespace: agentNamespace,
}));

vi.mock('./repo-namespace.js', () => ({
  repoToolingNamespace: repoNamespace,
}));

import { llmToolingNamespace } from './llm-namespace.js';

describe('llmToolingNamespace', () => {
  beforeEach(() => {
    agentNamespace.run.mockClear();
    repoNamespace.run.mockClear();
  });

  it('prints only the curated llm surface in help output', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await llmToolingNamespace.run(['help']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cdk llm'));
    expect(logSpy).toHaveBeenCalledWith(expect.not.stringContaining('review'));
  });

  it('routes provider administration commands through agent', async () => {
    await llmToolingNamespace.run(['models']);

    expect(agentNamespace.run).toHaveBeenCalledWith(['deterministic', 'models']);
  });

  it('routes deprecated repo workflows through repo with a warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await llmToolingNamespace.run(['review']);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Deprecated llm workflow surface'),
    );
    expect(repoNamespace.run).toHaveBeenCalledWith(['review']);
  });
});
