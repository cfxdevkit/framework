import { describe, expect, it, vi } from 'vitest';
import { resolvePiSessionSetup } from './agent-session-setup.js';

describe('resolvePiSessionSetup', () => {
  it('describes how a scope changes the session before interactive mode starts', async () => {
    const select = vi.fn()
      .mockResolvedValueOnce('local')
      .mockResolvedValueOnce('delivery');
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
        message: 'Session endpoint (local planning or GitHub implementation)',
        choices: expect.arrayContaining([
          expect.objectContaining({ value: 'local' }),
          expect.objectContaining({ value: 'github' }),
        ]),
      }),
      expect.objectContaining({ clearPromptOnDone: true }),
    );
    expect(select).toHaveBeenNthCalledWith(
      2,
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
    expect(select.mock.calls[1]?.[0]?.choices).toEqual(
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
      expect.objectContaining({
        message: 'Session prompt or context for delivery preset on local endpoint (optional)',
      }),
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
      prompts: { select: vi.fn(async () => 'local'), input },
    });

    expect(input).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Commit session context for operations preset on local endpoint (optional)',
      }),
      expect.objectContaining({ clearPromptOnDone: true }),
    );
    expect(result).toEqual({
      endpoint: 'local',
      scope: 'operations',
      promptArgs: ['stage the release notes'],
    });
  });
});
