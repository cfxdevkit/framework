import type { PiEffectiveActionPolicy, PiLlmConfig } from '../config/types.js';

export function resolveEffectiveActionPolicy(
  config: PiLlmConfig,
  options: { action?: string; phase?: string } = {},
): PiEffectiveActionPolicy {
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

export function resolveNamedProviderProfile(
  config: PiLlmConfig,
  profileName?: string | null,
): PiEffectiveActionPolicy['profile'] {
  const profile = profileName ? (config.providerProfiles?.[profileName] ?? null) : null;
  return {
    name: profileName ?? null,
    exists: profileName ? Boolean(profile) : true,
    provider: profile?.provider ?? config.provider ?? null,
    baseUrl: profile?.baseUrl ?? config.baseUrl ?? null,
    defaultModel: profile?.defaultModel ?? config.defaultModel ?? null,
    githubModel: profile?.githubModel ?? config.githubModel ?? null,
    requestTimeoutMs: profile?.requestTimeoutMs ?? config.requestTimeoutMs ?? null,
    providerStrategy: profile?.providerStrategy ?? config.harness?.providerStrategy ?? 'auto',
  };
}
