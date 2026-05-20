import type { ResolveProviderAttempt } from './types.js';

export class LlmProviderNotFoundError extends Error {
  readonly attempts: readonly ResolveProviderAttempt[];

  constructor(attempts: readonly ResolveProviderAttempt[]) {
    super(
      [
        'No LLM provider is available.',
        'Attempts:',
        ...attempts.map(
          (attempt) => `- ${attempt.step}: ${attempt.ok ? 'ok' : 'failed'} (${attempt.detail})`,
        ),
      ].join('\n'),
    );
    this.name = 'LlmProviderNotFoundError';
    this.attempts = attempts;
  }
}
