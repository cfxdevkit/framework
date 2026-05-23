import { describe, expect, it } from 'vitest';
import { parseApiEnrichmentResponse, resolveApiEnrichmentMaxTokens } from './api-enrichment.ts';

describe('parseApiEnrichmentResponse', () => {
  it('accepts strict JSON responses', () => {
    const lines = parseApiEnrichmentResponse(
      JSON.stringify({ enrichedLines: ['# title', '', '## `.`', '', '```ts', 'export {}', '```'] }),
    );

    expect(lines).toEqual(['# title', '', '## `.`', '', '```ts', 'export {}', '```']);
  });

  it('accepts fenced JSON responses', () => {
    const lines = parseApiEnrichmentResponse(
      ['```json', '{"enrichedLines":["# title","","## `.`"]}', '```'].join('\n'),
    );

    expect(lines).toEqual(['# title', '', '## `.`']);
  });

  it('accepts markdown responses when the model skips JSON', () => {
    const lines = parseApiEnrichmentResponse(
      [
        '# `@cfxdevkit/executor` — Public API',
        '',
        '## `.`',
        '',
        '### Usage',
        '',
        '```ts',
        'export {}',
        '```',
        '',
        '<!-- api-hash: deadbeef -->',
      ].join('\n'),
    );

    expect(lines).toEqual([
      '# `@cfxdevkit/executor` — Public API',
      '',
      '## `.`',
      '',
      '### Usage',
      '',
      '```ts',
      'export {}',
      '```',
    ]);
  });
});

describe('resolveApiEnrichmentMaxTokens', () => {
  it('raises the non-quick output budget for larger API pages', () => {
    const content = `# api\n\n${'export declare function example(): void;\n'.repeat(180)}`;

    expect(resolveApiEnrichmentMaxTokens(content, {})).toBeGreaterThanOrEqual(24000);
  });

  it('keeps quick mode on a smaller bounded budget', () => {
    const content = `# api\n\n${'export declare function example(): void;\n'.repeat(40)}`;

    expect(resolveApiEnrichmentMaxTokens(content, { quick: true })).toBeLessThanOrEqual(16000);
    expect(resolveApiEnrichmentMaxTokens(content, { quick: true })).toBeGreaterThanOrEqual(4800);
  });
});
