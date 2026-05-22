import { describe, expect, it, vi } from 'vitest';
import { resolvePiSessionSetup } from './agent-session-setup.js';

describe('resolvePiSessionSetup', () => {
  it('describes how a scope changes the session before interactive mode starts', async () => {
    const select = vi.fn(async () => 'delivery');
    const input = vi.fn(async () => '');

    await resolvePiSessionSetup({
      kind: 'interactive',
      promptArgs: [],
      stdin: { isTTY: true },
      stdout: { isTTY: true },
      prompts: { select, input },
    });

    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Session preset (shared default or targeted preload)',
        choices: expect.arrayContaining([
          expect.objectContaining({
            value: '',
            name: 'shared repo harness · full repo',
            description: expect.stringContaining('artifacts/llm/config/llm.json'),
          }),
          expect.objectContaining({
            value: 'delivery',
            name: 'delivery · deterministic preset',
            description: expect.stringContaining('artifacts/llm/config/units/delivery.json'),
          }),
        ]),
      }),
      expect.objectContaining({ clearPromptOnDone: true }),
    );
    expect(select.mock.calls[0]?.[0]?.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 'delivery',
          description: expect.stringContaining(
            'Preloads planning, OpenSpec, ADR, and documentation context',
          ),
        }),
      ]),
    );
    expect(input).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Session prompt or context for delivery preset (optional)' }),
      expect.objectContaining({ clearPromptOnDone: true }),
    );
  });

  it('uses the selected scope name in commit setup prompts', async () => {
    const input = vi.fn(async () => 'stage the release notes');

    const result = await resolvePiSessionSetup({
      kind: 'commit',
      scope: 'operations',
      promptArgs: [],
      stdin: { isTTY: true },
      stdout: { isTTY: true },
      prompts: { select: vi.fn(async () => ''), input },
    });

    expect(input).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Commit session context for operations preset (optional)' }),
      expect.objectContaining({ clearPromptOnDone: true }),
    );
    expect(result).toEqual({ scope: 'operations', promptArgs: ['stage the release notes'] });
  });
});