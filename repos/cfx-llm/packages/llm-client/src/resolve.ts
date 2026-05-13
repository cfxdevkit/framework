import { readConfig } from '../workers/completion/client.js';
import { defaultBaseUrls } from '../workers/shared/index.js';
import { LlmProviderNotFoundError } from './errors.js';
import { GitHubModelsProvider } from './github-models.js';
import { LemonadeProvider } from './lemonade.js';
import { OpenAICompatProvider } from './openai-compat.js';
import type { LlmProvider, ResolveProviderAttempt } from './types.js';

export async function resolveProvider(): Promise<LlmProvider> {
  const attempts: ResolveProviderAttempt[] = [];
  const config = await readConfig();

  if (config.baseUrl) {
    attempts.push({ step: 'config file baseUrl', ok: true, detail: config.baseUrl });
    return new LemonadeProvider({ baseUrl: config.baseUrl, defaultModel: config.defaultModel });
  }
  attempts.push({ step: 'config file baseUrl', ok: false, detail: 'not configured' });

  const lemonadeUrl = process.env.LEMONADE_URL ?? process.env.LEMONADE_BASE_URL;
  if (lemonadeUrl) {
    attempts.push({ step: 'LEMONADE_URL/LEMONADE_BASE_URL', ok: true, detail: lemonadeUrl });
    return new LemonadeProvider({ baseUrl: lemonadeUrl, defaultModel: config.defaultModel });
  }
  attempts.push({ step: 'LEMONADE_URL/LEMONADE_BASE_URL', ok: false, detail: 'not set' });

  const localProvider = new LemonadeProvider({
    baseUrls: defaultBaseUrls,
    defaultModel: config.defaultModel,
  });
  const localModels = await localProvider.discoverModels();
  if (localModels.length > 0) {
    attempts.push({
      step: 'local Lemonade probe',
      ok: true,
      detail: `${localModels.length} model(s)`,
    });
    return localProvider;
  }
  attempts.push({ step: 'local Lemonade probe', ok: false, detail: 'no models discovered' });

  if (process.env.OPENAI_BASE_URL && process.env.OPENAI_API_KEY) {
    attempts.push({
      step: 'OPENAI_BASE_URL + OPENAI_API_KEY',
      ok: true,
      detail: process.env.OPENAI_BASE_URL,
    });
    return new OpenAICompatProvider({ defaultModel: config.defaultModel });
  }
  attempts.push({
    step: 'OPENAI_BASE_URL + OPENAI_API_KEY',
    ok: false,
    detail: 'missing one or both env vars',
  });

  if (process.env.GITHUB_TOKEN) {
    attempts.push({ step: 'GITHUB_TOKEN', ok: true, detail: 'using GitHub Models' });
    return new GitHubModelsProvider({ defaultModel: config.githubModel ?? config.defaultModel });
  }
  attempts.push({ step: 'GITHUB_TOKEN', ok: false, detail: 'not set' });

  throw new LlmProviderNotFoundError(attempts);
}
