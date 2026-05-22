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

  it('captures changeset controls for release-aware commits', () => {
    expect(parseCommitFlags(['--skip-changeset', '--changeset-bump', 'minor'])).toMatchObject({
      skipChangeset: true,
      changesetBump: 'minor',
    });
  });
});

describe('fallbackCommitMessage', () => {
  it('returns valid conventional metadata from changeset guidance', () => {
    const commit = fallbackCommitMessage({
      releaseRelevant: true,
      summary: 'Prepared fallback changesets for changed package tooling.',
      packages: [{ name: '@cfxdevkit/llm-tools', dir: 'repos/cfx-llm/packages/llm-tools' }],
      changesets: [
        {
          packageName: '@cfxdevkit/llm-tools',
          bump: 'patch',
          summary: 'Align commit automation with Changesets.',
        },
      ],
      risks: [],
    });

    expect(commit.subject).toMatch(/^chore: /);
    expect(commit.body).toContain(
      '@cfxdevkit/llm-tools: patch - Align commit automation with Changesets.',
    );
    expect(commit.filesToStage).toEqual([]);
    expect(commit.risks[0]).toContain('@cfxdevkit/llm-tools');
  });
});

describe('commit worker wiring', () => {
  it('imports every helper it calls during approval', async () => {
    const source = await readFile(fileURLToPath(new URL('./commit.ts', import.meta.url)), 'utf8');

    expect(source).toContain('confirmPrompt(');
    expect(source).toMatch(/import\s*\{[\s\S]*confirmPrompt[\s\S]*\}\s*from '\.\/message\.ts'/);
  });
});
