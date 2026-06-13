import type { ExtensionAPI, ProviderModelConfig } from '@earendil-works/pi-coding-agent';
import type { PiLlmProviderType } from './config.js';
import { readPiConfig, resolvePiConfigPath } from './config.js';
import type { PiScopeName } from './extension.js';
import { resolvePiModel, resolveProviderState } from './provider-discovery.js';
import type { PiCliInvocation, PiLlmModel, PiProviderBridge } from './provider-types.js';

/**
 * Name of the environment variable the PI OpenAI provider reads the API key
 * from. The PI SDK's `apiKey` field expects the variable name, not the secret
 * itself — the actual value is injected via `env.OPENAI_API_KEY`.
 */
const OPENAI_API_KEY_ENV = 'OPENAI_API_KEY';

export function registerPiProviderBridge(pi: ExtensionAPI, bridge: PiProviderBridge): void {
  pi.registerProvider('openai', {
    name: 'CFX DevKit OpenAI-Compatible',
    baseUrl: bridge.providerBaseUrl ?? undefined,
    apiKey: OPENAI_API_KEY_ENV,
    api: 'openai-completions',
    models: createPiProviderModels(bridge.models, bridge.defaultModel, bridge.providerBaseUrl),
  });
}

export async function createPiProviderBridge(scope?: PiScopeName): Promise<PiProviderBridge> {
  const configPath = resolvePiConfigPath(scope);
  const config = await readPiConfig(configPath);
  const provider = await resolveProviderState(config);
  const providerBaseUrl = provider.baseUrl;
  const defaultModel = provider.defaultModel ?? config.defaultModel ?? null;
  const providerStrategy = config.harness.providerStrategy;

  return {
    config,
    providerType: provider.type,
    models: provider.models,
    configPath,
    providerStrategy,
    providerBaseUrl,
    defaultModel,
    pi: resolvePiCliInvocation(provider.type, providerBaseUrl, defaultModel, provider.models),
    scope,
  };
}

function resolvePiCliInvocation(
  providerType: PiLlmProviderType,
  providerBaseUrl: string | null,
  defaultModel: string | null,
  models: readonly PiLlmModel[],
): PiCliInvocation {
  const env: Record<string, string> = {};
  if (providerType === 'github-models') {
    env.OPENAI_API_KEY = process.env.GITHUB_TOKEN ?? process.env.OPENAI_API_KEY ?? '';
    return {
      provider: 'openai',
      model: resolvePiModel(defaultModel, models),
      env,
    };
  }

  if (providerBaseUrl) {
    env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'cfxdevkit-local-placeholder';
  }

  return {
    provider: 'openai',
    model: resolvePiModel(defaultModel, models),
    env,
  };
}

function createPiProviderModels(
  models: readonly PiLlmModel[],
  defaultModel: string | null,
  providerBaseUrl: string | null,
): ProviderModelConfig[] {
  const providerModels = models.length > 0 ? models : [{ id: defaultModel ?? 'default-model' }];
  return providerModels.map((model) => {
    const id = model.id ?? model.checkpoint ?? model.recipe ?? defaultModel ?? 'default-model';
    return {
      id,
      name: id,
      ...(providerBaseUrl ? { baseUrl: providerBaseUrl } : {}),
      reasoning: false,
      input: ['text'],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
      },
      contextWindow: 128000,
      maxTokens: 8192,
    };
  });
}
