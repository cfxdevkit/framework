import { GitHubModelsProvider, type GitHubModelsProviderOptions } from './github-models.js';
import { LemonadeProvider, type LemonadeProviderOptions } from './lemonade.js';
import { OpenAICompatProvider, type OpenAICompatProviderOptions } from './openai-compat.js';
import type { LlmProvider, LlmProviderType } from './types.js';

export type ProviderFactoryOptions =
  | LemonadeProviderOptions
  | OpenAICompatProviderOptions
  | GitHubModelsProviderOptions;

export function createProvider(
  type: LlmProviderType,
  config: ProviderFactoryOptions = {},
): LlmProvider {
  if (type === 'lemonade') return new LemonadeProvider(config as LemonadeProviderOptions);
  if (type === 'openai-compat')
    return new OpenAICompatProvider(config as OpenAICompatProviderOptions);
  return new GitHubModelsProvider(config as GitHubModelsProviderOptions);
}
