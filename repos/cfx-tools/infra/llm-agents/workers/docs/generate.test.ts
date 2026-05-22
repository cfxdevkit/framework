import { describe, expect, it } from 'vitest';
import { resolveDocsUpkeepArtifactMaxTokens } from './generate.ts';

describe('resolveDocsUpkeepArtifactMaxTokens', () => {
  it('raises the full-mode budget for larger docs upkeep prompts', () => {
    const prompt = ['Repository docs context:', 'A'.repeat(18000), 'Folder contents:', 'B'.repeat(12000)].join('\n');

    expect(resolveDocsUpkeepArtifactMaxTokens(prompt, {})).toBeGreaterThanOrEqual(12000);
  });

  it('keeps quick mode within a bounded smaller budget', () => {
    const prompt = ['Repository docs context:', 'A'.repeat(6000), 'Folder contents:', 'B'.repeat(4000)].join('\n');

    expect(resolveDocsUpkeepArtifactMaxTokens(prompt, { quick: true })).toBeLessThanOrEqual(8000);
    expect(resolveDocsUpkeepArtifactMaxTokens(prompt, { quick: true })).toBeGreaterThanOrEqual(2400);
  });
});