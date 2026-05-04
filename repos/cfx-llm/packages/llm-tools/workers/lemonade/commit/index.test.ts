import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseCommitFlags } from './index.ts';
import { fallbackCommitMessage } from './message.ts';

describe('parseCommitFlags', () => {
  it('preserves dry-run through a nested pnpm separator', () => {
    expect(parseCommitFlags(['--', '--dry-run']).dryRun).toBe(true);
  });

  it('captures model overrides for one-off commit runs', () => {
    expect(parseCommitFlags(['--model', 'Qwen3-Coder-Next-GGUF'])).toMatchObject({
      model: 'Qwen3-Coder-Next-GGUF',
    });
  });
});

describe('fallbackCommitMessage', () => {
  it('returns valid conventional metadata from changelog scope summaries', () => {
    const commit = fallbackCommitMessage([
      {
        ok: true,
        scope: { label: 'repos/cfx-llm' },
        summary: 'Repaired command routing and structural tests.',
      },
      {
        ok: true,
        scope: { label: 'root' },
        summary: 'Updated root LLM scripts.',
      },
    ]);

    expect(commit.subject).toMatch(/^refactor: /);
    expect(commit.body).toContain('repos/cfx-llm: Repaired command routing and structural tests.');
    expect(commit.filesToStage).toEqual([]);
    expect(commit.risks[0]).toContain('repos/cfx-llm, root');
  });
});

describe('commit worker wiring', () => {
  it('imports every helper it calls during approval', async () => {
    const source = await readFile(
      fileURLToPath(import.meta.url).replace(/\.test\.ts$/, '.ts'),
      'utf8',
    );

    expect(source).toContain('confirmPrompt(');
    expect(source).toMatch(/import\s*\{[\s\S]*confirmPrompt[\s\S]*\}\s*from '\.\/message\.ts'/);
  });
});
