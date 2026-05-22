import { describe, expect, it } from 'vitest';
import { extractAssistantText } from './client.ts';

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
