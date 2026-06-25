/**
 * Cloud chat-completion credentials for the PI agent runtime.
 *
 * The cloud endpoint prefers OpenRouter when `OPENROUTER_API_KEY` is present and
 * falls back to the existing GitHub Copilot configuration (`GITHUB_TOKEN`)
 * otherwise. OpenRouter is OpenAI-compatible, so callers treat the resolved
 * provider as `openai-compat`.
 */

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const OPENROUTER_DEFAULT_MODEL = 'deepseek-v4-pro';
export const OPENROUTER_API_KEY_ENV = 'OPENROUTER_API_KEY';
export const OPENROUTER_MODEL_ENV = 'OPENROUTER_MODEL';

/** True when an OpenRouter API key is available in the environment. */
export function hasOpenRouterKey(): boolean {
  return Boolean(process.env[OPENROUTER_API_KEY_ENV]?.trim());
}

/** Trimmed OpenRouter API key, or null when unset. */
export function openRouterApiKey(): string | null {
  return process.env[OPENROUTER_API_KEY_ENV]?.trim() || null;
}

/** OpenRouter model id, honoring `OPENROUTER_MODEL` then the default. */
export function openRouterModel(): string {
  return process.env[OPENROUTER_MODEL_ENV]?.trim() || OPENROUTER_DEFAULT_MODEL;
}

/** True when a base URL targets the OpenRouter endpoint. */
export function isOpenRouterBaseUrl(baseUrl: string | null | undefined): boolean {
  return Boolean(baseUrl?.includes('openrouter.ai'));
}
