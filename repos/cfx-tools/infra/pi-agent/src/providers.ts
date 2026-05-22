import { join } from 'node:path';
import type { ExtensionAPI, ProviderModelConfig } from '@earendil-works/pi-coding-agent';
import type { PiScopeName } from './extension.js';
import {
  loadLlmClientModule,
  type PiLlmConfig,
  type PiLlmModel,
  type PiLlmProviderType,
} from './llm-client-runtime.js';

const configPathEnvVar = 'CFXDEVKIT_LLM_CONFIG_PATH';

export type PiCliProvider = 'github' | 'openai';

export interface PiCliInvocation {
  readonly provider: PiCliProvider;
  readonly model: string | null;
  readonly env: Readonly<Record<string, string>>;
}

export interface PiProviderBridge {
  readonly config: PiLlmConfig;
  readonly providerType: PiLlmProviderType;
  readonly models: readonly PiLlmModel[];
  readonly configPath: string;
  readonly providerStrategy: 'auto' | 'gateway' | 'direct';
  readonly providerBaseUrl: string | null;
  readonly defaultModel: string | null;
  readonly pi: PiCliInvocation;
  readonly scope?: PiScopeName;
}

export function registerPiProviderBridge(pi: ExtensionAPI, bridge: PiProviderBridge): void {
  if (bridge.pi.provider === 'github') {
    return;
  }

  pi.registerProvider('openai', {
    name: 'CFX DevKit OpenAI-Compatible',
    baseUrl: bridge.providerBaseUrl ?? undefined,
    apiKey: 'OPENAI_API_KEY',
    api: 'openai-completions',
    models: createPiProviderModels(bridge.models, bridge.defaultModel, bridge.providerBaseUrl),
  });
}

export async function createPiProviderBridge(scope?: PiScopeName): Promise<PiProviderBridge> {
  const llmClient = await loadLlmClientModule();
  const configPath = resolveScopedConfigPath(scope);
  const { config, provider, models } = await withScopedConfig(scope, async () => {
    const config = await llmClient.readConfig();
    const provider = await llmClient.resolveProvider();
    const models = await provider.discoverModels();
    return { config, provider, models };
  });
  const providerBaseUrl = llmClient.getProviderBaseUrl(provider) || null;
  const defaultModel = llmClient.getProviderDefaultModel(provider) ?? config.defaultModel ?? null;
  const providerStrategy = readProviderStrategy(config);

  return {
    config,
    providerType: provider.type,
    models,
    configPath,
    providerStrategy,
    providerBaseUrl,
    defaultModel,
    pi: resolvePiCliInvocation(provider.type, providerBaseUrl, defaultModel, models),
    scope,
  };
}

async function withScopedConfig<T>(
  scope: string | undefined,
  action: () => Promise<T>,
): Promise<T> {
  if (!scope) {
    return await action();
  }

  const previous = process.env[configPathEnvVar];
  process.env[configPathEnvVar] = resolveScopedConfigPath(scope);
  try {
    return await action();
  } finally {
    if (previous === undefined) {
      delete process.env[configPathEnvVar];
    } else {
      process.env[configPathEnvVar] = previous;
    }
  }
}

function resolveScopedConfigPath(scope?: PiScopeName): string {
  const repoRoot = process.cwd();
  if (!scope) {
    return join(repoRoot, '.pi', 'providers.json');
  }

  return join(repoRoot, 'artifacts', 'llm', 'config', 'units', `${scope}.json`);
}

function readProviderStrategy(config: PiLlmConfig): 'auto' | 'gateway' | 'direct' {
  const strategy = (config as { harness?: { providerStrategy?: string } }).harness
    ?.providerStrategy;
  if (strategy === 'gateway' || strategy === 'direct') {
    return strategy;
  }
  return 'auto';
}

function resolvePiCliInvocation(
  providerType: PiLlmProviderType,
  providerBaseUrl: string | null,
  defaultModel: string | null,
  models: readonly PiLlmModel[],
): PiCliInvocation {
  if (providerType === 'github-models') {
    return {
      provider: 'github',
      model: resolvePiModel(defaultModel, models),
      env: {},
    };
  }

  const env: Record<string, string> = {};
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
