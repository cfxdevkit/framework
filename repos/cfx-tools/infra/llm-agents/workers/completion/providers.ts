import { defaultBaseUrls } from '../shared/index.ts';
import { readConfig } from './config.ts';
import {
  GitHubModelsProvider,
  LemonadeProvider,
  LiteLLMProvider,
  OpenAICompatProvider,
} from './provider/classes';
import { getProviderDefaultModel, resolveProviderModel } from './provider/meta';
import type { LlmConfig, LlmProvider, LlmProviderType } from './types.ts';

export async function resolveProvider(
  config?: LlmConfig,
  overrides?: { readonly apiKey?: string },
): Promise<LlmProvider> {
  const resolvedConfig = config ?? (await readConfig());
  const providerType = configuredProvider(resolvedConfig);

  if (providerType === 'github-models') {
    return new GitHubModelsProvider({
      defaultModel: resolvedConfig.githubModel ?? resolvedConfig.defaultModel,
      ...(overrides?.apiKey ? { token: overrides.apiKey } : {}),
    });
  }

  if (resolvedConfig.baseUrl) {
    if (providerType === 'litellm') {
      return new LiteLLMProvider({
        baseUrl: resolvedConfig.baseUrl,
        defaultModel: resolvedConfig.defaultModel,
        ...(overrides?.apiKey ? { apiKey: overrides.apiKey } : {}),
      });
    }
    if (providerType === 'openai-compat') {
      return new OpenAICompatProvider({
        baseUrl: resolvedConfig.baseUrl,
        defaultModel: resolvedConfig.defaultModel,
        ...(overrides?.apiKey ? { apiKey: overrides.apiKey } : {}),
      });
    }
    return new LemonadeProvider({
      baseUrl: resolvedConfig.baseUrl,
      defaultModel: resolvedConfig.defaultModel,
    });
  }

  if (process.env.LITELLM_BASE_URL) {
    return new LiteLLMProvider({
      baseUrl: process.env.LITELLM_BASE_URL,
      defaultModel: resolvedConfig.defaultModel,
    });
  }

  const lemonadeUrl = process.env.LEMONADE_URL ?? process.env.LEMONADE_BASE_URL;
  if (lemonadeUrl) {
    return new LemonadeProvider({
      baseUrl: lemonadeUrl,
      defaultModel: resolvedConfig.defaultModel,
    });
  }

  const localProvider = new LemonadeProvider({
    baseUrls: defaultBaseUrls,
    defaultModel: resolvedConfig.defaultModel,
  });
  const localModels = await localProvider.discoverModels();
  if (localModels.length > 0) {
    return localProvider;
  }

  if (process.env.OPENAI_BASE_URL && process.env.OPENAI_API_KEY) {
    return new OpenAICompatProvider({ defaultModel: resolvedConfig.defaultModel });
  }

  if (process.env.GITHUB_TOKEN) {
    return new GitHubModelsProvider({
      defaultModel: resolvedConfig.githubModel ?? resolvedConfig.defaultModel,
    });
  }

  throw new Error('No LLM provider could be resolved from config or environment.');
}

function configuredProvider(config: { provider?: string | null }): LlmProviderType {
  if (config.provider === 'lemonade') return 'lemonade';
  if (config.provider === 'litellm') return 'litellm';
  if (config.provider === 'openai-compat') return 'openai-compat';
  if (config.provider === 'github-models') return 'github-models';
  return 'lemonade';
}

export { getProviderDefaultModel, resolveProviderModel };
