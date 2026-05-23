import { isRecord } from './guards.ts';
import type { LlmModel, LlmProvider } from './types.ts';

export function getProviderBaseUrl(provider: LlmProvider): string {
  if ('baseUrl' in provider && typeof provider.baseUrl === 'string') {
    return normalizeBaseUrl(provider.baseUrl);
  }
  if ('baseUrls' in provider && Array.isArray(provider.baseUrls)) {
    return normalizeBaseUrl(provider.baseUrls[0] ?? '');
  }
  if ('endpoint' in provider && typeof provider.endpoint === 'string') {
    return normalizeBaseUrl(provider.endpoint);
  }
  return '';
}

export function getProviderDefaultModel(provider: LlmProvider): string | null {
  return 'defaultModel' in provider && typeof provider.defaultModel === 'string'
    ? provider.defaultModel
    : null;
}

export async function resolveProviderModel(
  provider: LlmProvider,
  preferred?: string | null,
): Promise<string> {
  const models = await provider.discoverModels();
  const fallback = preferred ?? getProviderDefaultModel(provider) ?? 'local-model';
  return modelIdentifier(provider.chooseModel(models, preferred), fallback);
}

export function parseModels(text: string, baseUrl?: string): readonly LlmModel[] {
  try {
    const parsed = JSON.parse(text);
    const data = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.data)
        ? parsed.data
        : [];
    return data
      .filter(isRecord)
      .map((model) => ({
        id: typeof model.id === 'string' ? model.id : undefined,
        checkpoint: typeof model.checkpoint === 'string' ? model.checkpoint : undefined,
        labels: Array.isArray(model.labels)
          ? model.labels.filter((label): label is string => typeof label === 'string')
          : [],
        recipe: typeof model.recipe === 'string' ? model.recipe : undefined,
        size: typeof model.size === 'number' ? model.size : undefined,
        suggested: model.suggested === true,
        baseUrl,
      }))
      .filter((model) => model.id || model.checkpoint);
  } catch {
    return [];
  }
}

export function chooseBestModel(
  models: readonly LlmModel[],
  preferred?: string | null,
): LlmModel | undefined {
  if (preferred) {
    const exact = models.find((model) => model.id === preferred || model.checkpoint === preferred);
    if (exact) return exact;
  }
  return models.find((model) => model.suggested) ?? models[0];
}

export function modelIdentifier(model: LlmModel | undefined, fallback: string): string {
  return model?.id ?? model?.checkpoint ?? fallback;
}

export function normalizeBaseUrl(url: string): string {
  const value = url.trim();
  if (!value) return value;
  return value.endsWith('/') ? value : `${value}/`;
}

export function joinEndpoint(baseUrl: string, path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  return new URL(cleanPath, normalizeBaseUrl(baseUrl)).toString();
}

export function formatFetchError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause;
  if (isRecord(cause) && typeof cause.code === 'string') {
    return `${error.message} (${cause.code})`;
  }
  return error.message;
}

export function extractTextNode(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((entry) => extractTextNode(entry))
      .filter((entry) => entry.trim())
      .join('')
      .trim();
  }
  if (!isRecord(value)) return '';
  if (typeof value.text === 'string') return value.text;
  if (typeof value.content === 'string') return value.content;
  if (Array.isArray(value.content)) return extractTextNode(value.content);
  return '';
}
