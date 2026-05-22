import { readConfig } from '../workers/completion/client.js';
import { configPathEnvVar } from '../workers/shared/index.js';
import { findMonorepoUnit, resolveAgentConfigPath } from '../workers/shared/units.js';
import { getProviderBaseUrl, getProviderDefaultModel } from './provider-meta.js';
import { resolveProvider } from './resolve.js';
import type {
  LlmConfig,
  LlmEffectiveActionPolicy,
  LlmModel,
  LlmProviderType,
  LlmResolvedProviderProfile,
  LlmRuntimeBridgeState,
} from './types.js';

export async function resolveRuntimeBridgeState(
  scope?: string,
  options: { action?: string; phase?: string } = {},
): Promise<LlmRuntimeBridgeState> {
  return await withScopedConfig(scope, async () => {
    const config = await readConfig();
    const provider = await resolveProvider();
    const models = await provider.discoverModels();
    const unit = scope ? (findMonorepoUnit(scope) ?? null) : null;
    const effectivePolicy = resolveEffectiveActionPolicy(config, options);
    return {
      scope: unit?.name ?? scope,
      unit,
      configPath: resolveAgentConfigPath(scope),
      config,
      providerType: provider.type,
      providerBaseUrl: getProviderBaseUrl(provider),
      defaultModel: getProviderDefaultModel(provider) ?? config.defaultModel ?? null,
      models,
      providerStrategy: config.harness.providerStrategy,
      effectivePolicy,
    };
  });
}

export async function resolveScopedRuntimeConfig(scope?: string): Promise<LlmConfig> {
  return await withScopedConfig(scope, async () => await readConfig());
}

export async function listScopedRuntimeModels(scope?: string): Promise<readonly LlmModel[]> {
  return await withScopedConfig(scope, async () => {
    const provider = await resolveProvider();
    return await provider.discoverModels();
  });
}

export async function resolveScopedProviderType(scope?: string): Promise<LlmProviderType> {
  return await withScopedConfig(scope, async () => (await resolveProvider()).type);
}

export function listProviderProfiles(
  config: LlmConfig,
): readonly [string, LlmResolvedProviderProfile][] {
  return Object.keys(config.providerProfiles ?? {})
    .sort((left, right) => left.localeCompare(right))
    .map((name) => [name, resolveNamedProviderProfile(config, name)]);
}

export function resolveNamedProviderProfile(
  config: LlmConfig,
  profileName?: string | null,
): LlmResolvedProviderProfile {
  const profile = profileName ? (config.providerProfiles?.[profileName] ?? null) : null;
  return {
    name: profileName ?? null,
    exists: profileName ? Boolean(profile) : true,
    provider: profile?.provider ?? config.provider ?? null,
    baseUrl: profile?.baseUrl ?? config.baseUrl ?? null,
    defaultModel: profile?.defaultModel ?? config.defaultModel ?? null,
    githubModel: profile?.githubModel ?? config.githubModel ?? null,
    requestTimeoutMs: profile?.requestTimeoutMs ?? config.requestTimeoutMs ?? null,
    providerStrategy: profile?.providerStrategy ?? config.harness.providerStrategy,
  };
}

export function resolveEffectiveActionPolicy(
  config: LlmConfig,
  options: { action?: string; phase?: string } = {},
): LlmEffectiveActionPolicy {
  const action = options.action?.trim() || undefined;
  const phase = options.phase?.trim() || undefined;
  const legacyActionModel = action ? (config.actions?.[action] ?? null) : null;
  const actionPolicy = action ? (config.actionPolicies?.[action] ?? null) : null;
  const phasePolicy = phase ? (actionPolicy?.phases?.[phase] ?? null) : null;
  const source = phasePolicy ? 'phase' : actionPolicy || legacyActionModel ? 'action' : 'default';
  const profileName = phasePolicy?.profile ?? actionPolicy?.profile ?? null;
  const profile = resolveNamedProviderProfile(config, profileName);
  const model =
    phasePolicy?.model ??
    actionPolicy?.model ??
    legacyActionModel ??
    profile.defaultModel ??
    config.defaultModel ??
    null;

  return {
    action,
    phase,
    source,
    legacyActionModel,
    profile,
    model,
  };
}

async function withScopedConfig<T>(
  scope: string | undefined,
  action: () => Promise<T>,
): Promise<T> {
  const previous = process.env[configPathEnvVar];

  if (!scope) {
    return await action();
  }

  process.env[configPathEnvVar] = resolveAgentConfigPath(scope);
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
