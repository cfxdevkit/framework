import type { PiLlmConfig, PiLlmProviderType } from './config.js';
import type { PiLlmModel, PiResolvedProviderState } from './provider-types.js';

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
    return {
      type: 'lemonade',
      baseUrl: lemonadeUrl,
      defaultModel: config.defaultModel,
      models: await discoverProviderModels('lemonade', lemonadeUrl),
    };
  }

  for (const baseUrl of defaultBaseUrls) {
    const models = await discoverProviderModels('lemonade', baseUrl);
    if (models.length > 0) {
      return {
        type: 'lemonade',
        baseUrl,
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
    for (const path of modelPaths) {
      const models = await fetchModelCatalog(baseUrl, path);
      if (models.length > 0) return models;
    }
    return [];
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
