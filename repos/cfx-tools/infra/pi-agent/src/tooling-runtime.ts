import {
  defaultPiConfig,
  readPiConfig,
  resolveEffectiveActionPolicy,
  resolveNamedProviderProfile,
  type PiLlmConfig,
  type PiLlmProviderType,
  writePiConfig,
} from './config.js';
import { createPiProviderBridge, type PiLlmModel } from './providers.js';

interface PiToolingProvider {
  readonly type: PiLlmProviderType;
  readonly baseUrl: string | null;
  readonly defaultModel: string | null;
  discoverModels(): Promise<readonly PiLlmModel[]>;
  chooseModel(models: readonly PiLlmModel[], preferred?: string | null): PiLlmModel | undefined;
}

export function defaultConfig(): PiLlmConfig {
  return defaultPiConfig();
}

export async function readConfig(): Promise<PiLlmConfig> {
  return await readPiConfig();
}

export async function writeConfig(config: PiLlmConfig): Promise<void> {
  await writePiConfig(config);
}

export { resolveNamedProviderProfile };

export async function resolveRuntimeBridgeState(
  scope?: string,
  options: { action?: string; phase?: string } = {},
): Promise<{
  readonly scope: string | undefined;
  readonly configPath: string;
  readonly config: PiLlmConfig;
  readonly providerType: PiLlmProviderType;
  readonly providerBaseUrl: string | null;
  readonly defaultModel: string | null;
  readonly models: readonly PiLlmModel[];
  readonly providerStrategy: 'auto' | 'gateway' | 'direct';
  readonly effectivePolicy: ReturnType<typeof resolveEffectiveActionPolicy>;
}> {
  const bridge = await createPiProviderBridge(scope as never);
  return {
    scope,
    configPath: bridge.configPath,
    config: bridge.config,
    providerType: bridge.providerType,
    providerBaseUrl: bridge.providerBaseUrl,
    defaultModel: bridge.defaultModel,
    models: bridge.models,
    providerStrategy: bridge.providerStrategy,
    effectivePolicy: resolveEffectiveActionPolicy(bridge.config, options),
  };
}

export async function resolveProvider(): Promise<PiToolingProvider> {
  const bridge = await createPiProviderBridge();
  return {
    type: bridge.providerType,
    baseUrl: bridge.providerBaseUrl,
    defaultModel: bridge.defaultModel,
    discoverModels: async () => bridge.models,
    chooseModel(models, preferred) {
      return chooseBestModel(models, preferred);
    },
  };
}

export function getProviderBaseUrl(provider: PiToolingProvider): string {
  return provider.baseUrl ?? '';
}

export function getProviderDefaultModel(provider: PiToolingProvider): string | null {
  return provider.defaultModel ?? null;
}

export async function resolveProviderModel(
  provider: PiToolingProvider,
  preferred?: string | null,
): Promise<string> {
  const fallback = preferred ?? getProviderDefaultModel(provider) ?? 'local-model';
  const models = await provider.discoverModels();
  return modelIdentifier(provider.chooseModel(models, fallback), fallback);
}

function chooseBestModel(
  models: readonly PiLlmModel[],
  preferred?: string | null,
): PiLlmModel | undefined {
  if (preferred) {
    const exact = models.find((model) => model.id === preferred || model.checkpoint === preferred);
    if (exact) {
      return exact;
    }
  }
  return models.find((model) => model.suggested) ?? models[0];
}

function modelIdentifier(model: PiLlmModel | undefined, fallback: string): string {
  return model?.id ?? model?.checkpoint ?? model?.recipe ?? fallback;
}
