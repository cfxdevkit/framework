import type { ExtensionAPI, ProviderModelConfig } from '@earendil-works/pi-coding-agent';
import { isOpenRouterBaseUrl, openRouterApiKey } from '../cloud-credentials.js';
import { readPiConfig } from '../config/storage.js';
import type { PiLlmProviderType } from '../config/types.js';
import { resolveProviderState } from '../provider/discovery.js';
import type { PiCliInvocation, PiLlmModel, PiProviderBridge } from '../provider/types.js';

/**
 * Name of the environment variable the PI OpenAI provider reads the API key
 * from. The PI SDK's `apiKey` field expects the variable name, not the secret
 * itself — the actual value is injected via `env.OPENAI_API_KEY`.
 */
const OPENAI_API_KEY_ENV = 'OPENAI_API_KEY';

/**
 * Default context window: 256k (Qwen3.6-35B native window).
 */
const DEFAULT_CONTEXT_WINDOW = 262144;
const DEFAULT_MAX_TOKENS = Math.floor(DEFAULT_CONTEXT_WINDOW * 0.9);

/**
 * Register an OpenAI-compatible provider with PI.
 * Uses the resolved config to set up the provider with the correct
 * baseUrl, API key, and models.
 */
export function registerPiProviderBridge(pi: ExtensionAPI, bridge: PiProviderBridge): void {
  pi.registerProvider('openai', {
    name: 'CFX DevKit OpenAI-Compatible',
    baseUrl: bridge.providerBaseUrl ?? undefined,
    apiKey: OPENAI_API_KEY_ENV,
    api: 'openai-completions',
    models: createPiProviderModels(bridge.models, bridge.defaultModel, bridge.providerBaseUrl),
  });
}

/**
 * Create a provider bridge from the resolved config.
 * In the PI-integrated path, PI manages ~/.pi/agent/providers.json.
 * This reads the config and creates a bridge for PI command handlers.
 */
export async function createPiProviderBridge(): Promise<PiProviderBridge> {
  const config = await readPiConfig();
  const provider = await resolveProviderState(config);
  const providerBaseUrl = provider.baseUrl;
  const defaultModel = provider.defaultModel ?? config.defaultModel ?? null;
  const providerStrategy = config.harness.providerStrategy;

  return {
    config,
    providerType: provider.type,
    models: provider.models,
    configPath: resolvePiConfigPath(),
    providerStrategy,
    providerBaseUrl,
    defaultModel,
    pi: resolvePiCliInvocation(provider.type, providerBaseUrl, defaultModel, provider.models),
  };
}

/**
 * Resolve the config path.
 * PI manages ~/.pi/agent/providers.json at runtime.
 */
function resolvePiConfigPath(): string {
  return process.env.CFXDEVKIT_LLM_CONFIG_PATH || '.pi/providers.json';
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
    env.OPENAI_API_KEY = isOpenRouterBaseUrl(providerBaseUrl)
      ? (openRouterApiKey() ?? '')
      : (process.env.OPENAI_API_KEY ?? 'cfxdevkit-local-placeholder');
  }

  return {
    provider: 'openai',
    model: resolvePiModel(defaultModel, models),
    env,
  };
}

function resolvePiModel(defaultModel: string | null, models: readonly PiLlmModel[]): string | null {
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
      contextWindow: DEFAULT_CONTEXT_WINDOW,
      maxTokens: DEFAULT_MAX_TOKENS,
    };
  });
}
