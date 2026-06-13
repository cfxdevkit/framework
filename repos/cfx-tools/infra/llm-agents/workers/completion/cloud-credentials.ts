/**
 * Cloud chat-completion credentials.
 *
 * Cloud actions prefer OpenRouter when `OPENROUTER_API_KEY` is present and fall
 * back to the existing GitHub Copilot configuration (`GITHUB_TOKEN`) otherwise.
 * OpenRouter is OpenAI-compatible, so the resolved provider is always treated as
 * `openai-compat` by callers.
 */

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const OPENROUTER_DEFAULT_MODEL = 'deepseek-v4-pro';
export const OPENROUTER_API_KEY_ENV = 'OPENROUTER_API_KEY';
export const OPENROUTER_MODEL_ENV = 'OPENROUTER_MODEL';

export type CloudCredentialSource = 'openrouter' | 'copilot';

export interface CloudCredentials {
  /** Which backend supplied the credentials. */
  readonly source: CloudCredentialSource;
  /** Base URL for chat completions (no trailing path). */
  readonly baseUrl: string;
  /** Bearer API key for the cloud endpoint. */
  readonly apiKey: string;
  /** Model identifier to request. */
  readonly model: string;
}

/**
 * Resolve cloud credentials, preferring OpenRouter when its key is set.
 *
 * @param fallback Copilot/profile-derived base URL and model used when no
 *   OpenRouter key is present.
 */
export function resolveCloudCredentials(fallback: {
  readonly baseUrl: string;
  readonly model: string;
}): CloudCredentials {
  const openRouterKey = process.env[OPENROUTER_API_KEY_ENV]?.trim();
  if (openRouterKey) {
    return {
      source: 'openrouter',
      baseUrl: OPENROUTER_BASE_URL,
      apiKey: openRouterKey,
      model: process.env[OPENROUTER_MODEL_ENV]?.trim() || OPENROUTER_DEFAULT_MODEL,
    };
  }
  return {
    source: 'copilot',
    baseUrl: fallback.baseUrl,
    apiKey: process.env.GITHUB_TOKEN ?? 'local',
    model: fallback.model,
  };
}
