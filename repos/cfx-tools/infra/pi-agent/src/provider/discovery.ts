import { hasOpenRouterKey, OPENROUTER_BASE_URL, openRouterModel } from '../cloud-credentials.js';
import type { PiLlmConfig, PiLlmProviderType } from '../config.js';
import type { PiLlmModel, PiResolvedProviderState } from '../provider/types.js';

const defaultBaseUrls = [
  'http://localhost:13305/',
  'http://127.0.0.1:13305/',
  'http://host.docker.internal:13305/',
  'http://host.containers.internal:13305/',
  'http://127.0.0.1:8000/',
];

const modelPaths = ['/api/v1/models', '/v1/models', '/models'];

const githubModelsEndpoint = 'https://models.inference.ai.azure.com';

export async function resolveProviderState(config: PiLlmConfig): Promise<PiResolvedProviderState> {
  if (config.baseUrl) {
    const providerType = configuredProvider(config);
    if (providerType === 'lemonade') {
      const { models, apiBaseUrl } = await discoverLemonadeCatalog(config.baseUrl);
      return {
        type: providerType,
        baseUrl: apiBaseUrl,
        defaultModel: config.defaultModel,
        models,
      };
    }
    return {
      type: providerType,
      baseUrl: config.baseUrl,
      defaultModel:
        providerType === 'github-models'
          ? (config.githubModel ?? config.defaultModel)
          : config.defaultModel,
      models: await discoverProviderModels(providerType, config.baseUrl),
    };
  }

  const liteLlmUrl = process.env.LITELLM_BASE_URL;
  if (liteLlmUrl) {
    return {
      type: 'litellm',
      baseUrl: liteLlmUrl,
      defaultModel: config.defaultModel,
      models: await discoverProviderModels('litellm', liteLlmUrl),
    };
  }

  const lemonadeUrl = process.env.LEMONADE_URL ?? process.env.LEMONADE_BASE_URL;
  if (lemonadeUrl) {
    const { models, apiBaseUrl } = await discoverLemonadeCatalog(lemonadeUrl);
    return {
      type: 'lemonade',
      baseUrl: apiBaseUrl,
      defaultModel: config.defaultModel,
      models,
    };
  }

  for (const baseUrl of defaultBaseUrls) {
    const { models, apiBaseUrl } = await discoverLemonadeCatalog(baseUrl);
    if (models.length > 0) {
      return {
        type: 'lemonade',
        baseUrl: apiBaseUrl,
        defaultModel: config.defaultModel,
        models,
      };
    }
  }

  if (process.env.OPENAI_BASE_URL && process.env.OPENAI_API_KEY) {
    return {
      type: 'openai-compat',
      baseUrl: process.env.OPENAI_BASE_URL,
      defaultModel: config.defaultModel,
      models: await discoverProviderModels('openai-compat', process.env.OPENAI_BASE_URL),
    };
  }

  // Prefer OpenRouter over GitHub Copilot when its key is present.
  if (hasOpenRouterKey()) {
    return {
      type: 'openai-compat',
      baseUrl: OPENROUTER_BASE_URL,
      defaultModel: config.defaultModel ?? openRouterModel(),
      models: await discoverProviderModels('openai-compat', OPENROUTER_BASE_URL),
    };
  }

  if (process.env.GITHUB_TOKEN) {
    return {
      type: 'github-models',
      baseUrl: githubModelsEndpoint,
      defaultModel: config.githubModel ?? config.defaultModel,
      models: await discoverProviderModels('github-models', githubModelsEndpoint),
    };
  }

  throw new Error('Unable to resolve a PI provider from config or environment.');
}

export function resolvePiModel(
  defaultModel: string | null,
  models: readonly PiLlmModel[],
): string | null {
  if (defaultModel) {
    return defaultModel;
  }

  for (const model of models) {
    const candidate = model.id ?? model.checkpoint ?? model.recipe ?? null;
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function configuredProvider(config: PiLlmConfig): PiLlmProviderType {
  if (config.provider === 'lemonade') return 'lemonade';
  if (config.provider === 'litellm') return 'litellm';
  if (config.provider === 'openai-compat') return 'openai-compat';
  if (config.provider === 'github-models') return 'github-models';
  return 'litellm';
}

async function discoverProviderModels(
  providerType: PiLlmProviderType,
  baseUrl: string,
): Promise<readonly PiLlmModel[]> {
  if (providerType === 'lemonade') {
    const { models } = await discoverLemonadeCatalog(baseUrl);
    return models;
  }

  if (providerType === 'github-models') {
    return await fetchModelCatalog(baseUrl, 'models', {
      authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
    });
  }

  const authorization =
    providerType === 'litellm'
      ? (process.env.LITELLM_API_KEY ?? process.env.OPENAI_API_KEY ?? '')
      : (process.env.OPENAI_API_KEY ?? '');

  return await fetchModelCatalog(
    baseUrl,
    'models',
    authorization ? { authorization: `Bearer ${authorization}` } : undefined,
  );
}

/**
 * Probe a Lemonade-style server for its model catalog and, from the model path
 * that responds, derive the API base URL the server actually serves under
 * (e.g. `/api/v1/`). The PI SDK appends `chat/completions` to this base URL, so
 * returning the bare host would produce a 404 against Lemonade's `/api/v1`
 * surface. Mirrors the chat-path probing done by the LLM completion engine.
 */
async function discoverLemonadeCatalog(
  baseUrl: string,
): Promise<{ models: readonly PiLlmModel[]; apiBaseUrl: string }> {
  for (const path of modelPaths) {
    const models = await fetchModelCatalog(baseUrl, path);
    if (models.length > 0) {
      return { models, apiBaseUrl: deriveApiBaseUrl(baseUrl, path) };
    }
  }
  return { models: [], apiBaseUrl: normalizeBaseUrl(baseUrl) };
}

/**
 * Strip the trailing `models` segment from a working model-discovery path to
 * recover the server's API prefix, then resolve it against the base URL so
 * chat-completion clients target the same surface (`/api/v1/chat/completions`).
 */
function deriveApiBaseUrl(baseUrl: string, modelsPath: string): string {
  const prefix = modelsPath.replace(/models\/?$/, '').replace(/^\/+/, '');
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return prefix ? new URL(prefix, normalizedBaseUrl).toString() : normalizedBaseUrl;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

async function fetchModelCatalog(
  baseUrl: string,
  path: string,
  headers?: Record<string, string>,
): Promise<readonly PiLlmModel[]> {
  try {
    const response = await fetch(joinEndpoint(baseUrl, path), {
      headers,
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return [];
    return parseModels(await response.text(), baseUrl);
  } catch {
    return [];
  }
}

function joinEndpoint(baseUrl: string, path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL(cleanPath, normalizedBaseUrl).toString();
}

function parseModels(text: string, baseUrl?: string): readonly PiLlmModel[] {
  try {
    const parsed = JSON.parse(text) as unknown;
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

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}
