import { hasOpenRouterKey, OPENROUTER_BASE_URL, openRouterModel } from '../cloud-credentials.js';
import type { PiLlmConfig, PiLlmProviderType } from '../config/types.js';
import type { PiLlmModel, PiResolvedProviderState } from '../provider/types.js';

const githubModelsEndpoint = 'https://models.inference.ai.azure.com';

/**
 * Resolve provider state from config.
 * In the PI-integrated path, PI manages ~/.pi/agent/providers.json.
 * This reads the resolved config and derives provider state from it.
 */
export async function resolveProviderState(config: PiLlmConfig): Promise<PiResolvedProviderState> {
  // If config has a baseUrl, use it as-is (PI-managed config).
  if (config.baseUrl) {
    const providerType = configuredProvider(config);
    // For now, return minimal state — model discovery happens via PI.
    return {
      type: providerType,
      baseUrl: config.baseUrl,
      defaultModel:
        providerType === 'github-models'
          ? (config.githubModel ?? config.defaultModel)
          : config.defaultModel,
      models: [],
    };
  }

  const liteLlmUrl = process.env.LITELLM_BASE_URL;
  if (liteLlmUrl) {
    return {
      type: 'litellm',
      baseUrl: liteLlmUrl,
      defaultModel: config.defaultModel,
      models: [],
    };
  }

  // Fallback to OpenRouter or GitHub Models based on available keys.
  if (hasOpenRouterKey()) {
    return {
      type: 'openai-compat',
      baseUrl: OPENROUTER_BASE_URL,
      defaultModel: config.defaultModel ?? openRouterModel(),
      models: [],
    };
  }

  if (process.env.GITHUB_TOKEN) {
    return {
      type: 'github-models',
      baseUrl: githubModelsEndpoint,
      defaultModel: config.githubModel ?? config.defaultModel,
      models: [],
    };
  }

  // Default: use config's baseUrl or model if specified.
  return {
    type: config.provider ?? 'openai-compat',
    baseUrl: config.baseUrl,
    defaultModel: config.defaultModel,
    models: [],
  };
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
