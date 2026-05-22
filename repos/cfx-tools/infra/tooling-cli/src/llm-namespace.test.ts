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

  it('routes the legacy model picker command through agent config', async () => {
    await llmToolingNamespace.run(['model']);

    expect(agentNamespace.run).toHaveBeenCalledWith(['config', 'set', 'default-model']);
  });

  it('passes an explicit model id through the legacy model command', async () => {
    await llmToolingNamespace.run(['model', 'Qwen3-Coder-Next-GGUF']);

    expect(agentNamespace.run).toHaveBeenCalledWith([
      'config',
      'set',
      'default-model',
      'Qwen3-Coder-Next-GGUF',
    ]);
  });

  it('prints help instead of treating --help as a model id', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await llmToolingNamespace.run(['model', '--help']);

    expect(agentNamespace.run).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cdk llm model [id]'));
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
