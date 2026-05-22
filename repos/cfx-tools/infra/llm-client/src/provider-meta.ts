import { modelIdentifier } from './http.js';
import type { LlmProvider } from './types.js';

export function getProviderBaseUrl(provider: LlmProvider): string {
  if (provider.type === 'github-models') {
    return (provider as { endpoint?: string }).endpoint ?? '';
  }
  if (provider.type === 'lemonade') {
    return (provider as { baseUrls?: readonly string[] }).baseUrls?.[0] ?? '';
  }
  return (provider as { baseUrl?: string }).baseUrl ?? '';
}

export function getProviderDefaultModel(provider: LlmProvider): string | null {
  return (provider as { defaultModel?: string | null }).defaultModel ?? null;
}

export async function resolveProviderModel(
  provider: LlmProvider,
  preferred?: string | null,
): Promise<string> {
  const fallback = preferred ?? getProviderDefaultModel(provider) ?? 'local-model';
  const models = await provider.discoverModels();
  return modelIdentifier(provider.chooseModel(models, fallback), fallback);
}
