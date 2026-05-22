import { describe, expect, it } from 'vitest';
import { defaultConfig, extractAssistantText, normalizeConfig } from './client.ts';

describe('defaultConfig', () => {
  it('includes the repo harness defaults', () => {
    expect(defaultConfig().harness).toEqual({
      version: 1,
      defaultMode: 'deterministic',
      providerStrategy: 'auto',
      deterministic: {
        preserveDeterministicArtifacts: true,
        preserveDeterministicSections: true,
      },
      exploratory: {
        allowCodeChanges: true,
        allowWideChanges: true,
      },
    });
  });
});

describe('normalizeConfig', () => {
  it('merges partial harness overrides without dropping defaults', () => {
    expect(
      normalizeConfig({
        provider: 'openai-compat',
        harness: {
          providerStrategy: 'direct',
          exploratory: {
            allowWideChanges: false,
          },
        },
      }),
    ).toMatchObject({
      provider: 'openai-compat',
      harness: {
        version: 1,
        defaultMode: 'deterministic',
        providerStrategy: 'direct',
        deterministic: {
          preserveDeterministicArtifacts: true,
          preserveDeterministicSections: true,
        },
        exploratory: {
          allowCodeChanges: true,
          allowWideChanges: false,
        },
      },
    });
  });
});

describe('extractAssistantText', () => {
  it('extracts plain string assistant content', () => {
    expect(
      extractAssistantText(
        JSON.stringify({
          choices: [{ message: { content: 'hello' } }],
        }),
      ),
    ).toBe('hello');
  });

  it('extracts array-based assistant content', () => {
    expect(
      extractAssistantText(
        JSON.stringify({
          choices: [
            {
              message: {
                content: [
                  { type: 'text', text: 'hello ' },
                  { type: 'text', text: 'world' },
                ],
              },
            },
          ],
        }),
      ),
    ).toBe('hello world');
  });

  it('returns empty string when assistant content is empty', () => {
    expect(
      extractAssistantText(
        JSON.stringify({
          choices: [{ message: { content: '' } }],
        }),
      ),
    ).toBe('');
  });

  it('falls back to raw text only when no assistant content field exists', () => {
    expect(extractAssistantText('plain text response')).toBe('plain text response');
  });
});
