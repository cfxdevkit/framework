import { parseBoolean } from '../agent/runtime.js';
import { ensureActionPolicies, ensureProviderProfiles } from '../agent-config/details.js';

type MutableConfig = {
  providerProfiles?: Record<string, Record<string, unknown>>;
  actionPolicies?: Record<
    string,
    {
      profile?: string | null;
      model?: string | null;
      phases?: Record<string, Record<string, unknown>>;
    }
  >;
};

/**
 * Apply a profile or action-policy config key mutation to a mutable config copy.
 * Returns true if the key was handled, false if it's unknown.
 */
export function applyProfilePolicyKey(
  key: string,
  rest: readonly string[],
  config: MutableConfig,
): boolean {
  if (key === 'profile-provider') {
    const [profileName, provider] = rest;
    if (!profileName)
      throw new Error('Usage: cdk agent config set profile-provider <name> <provider>');
    if (
      provider !== 'lemonade' &&
      provider !== 'litellm' &&
      provider !== 'openai-compat' &&
      provider !== 'github-models'
    ) {
      throw new Error(
        'profile-provider must be lemonade, litellm, openai-compat, or github-models',
      );
    }
    ensureProviderProfiles(config)[profileName] = {
      ...(config.providerProfiles?.[profileName] ?? {}),
      provider,
    };
    return true;
  }
  if (key === 'profile-base-url') {
    const [profileName, baseUrl] = rest;
    if (!profileName || !baseUrl)
      throw new Error('Usage: cdk agent config set profile-base-url <name> <url>');
    ensureProviderProfiles(config)[profileName] = {
      ...(config.providerProfiles?.[profileName] ?? {}),
      baseUrl,
    };
    return true;
  }
  if (key === 'profile-default-model') {
    const [profileName, defaultModel] = rest;
    if (!profileName || !defaultModel)
      throw new Error('Usage: cdk agent config set profile-default-model <name> <id>');
    ensureProviderProfiles(config)[profileName] = {
      ...(config.providerProfiles?.[profileName] ?? {}),
      defaultModel,
    };
    return true;
  }
  if (key === 'profile-strategy') {
    const [profileName, strategy] = rest;
    if (!profileName)
      throw new Error('Usage: cdk agent config set profile-strategy <name> <auto|gateway|direct>');
    if (strategy !== 'auto' && strategy !== 'gateway' && strategy !== 'direct') {
      throw new Error('profile-strategy must be auto, gateway, or direct');
    }
    ensureProviderProfiles(config)[profileName] = {
      ...(config.providerProfiles?.[profileName] ?? {}),
      providerStrategy: strategy,
    };
    return true;
  }
  if (key === 'action-policy') {
    const [actionName, profileName] = rest;
    if (!actionName || !profileName)
      throw new Error('Usage: cdk agent config set action-policy <action> <profile>');
    ensureActionPolicies(config)[actionName] = {
      ...(config.actionPolicies?.[actionName] ?? {}),
      profile: profileName,
      phases: config.actionPolicies?.[actionName]?.phases ?? {},
    };
    return true;
  }
  if (key === 'phase-policy') {
    const [actionName, phaseName, profileName] = rest;
    if (!actionName || !phaseName || !profileName)
      throw new Error('Usage: cdk agent config set phase-policy <action> <phase> <profile>');
    const actionPolicy = ensureActionPolicies(config)[actionName] ?? {};
    ensureActionPolicies(config)[actionName] = {
      ...actionPolicy,
      phases: {
        ...(actionPolicy.phases ?? {}),
        [phaseName]: { ...(actionPolicy.phases?.[phaseName] ?? {}), profile: profileName },
      },
    };
    return true;
  }
  // harness keys handled in agent-config.ts via spread
  if (
    key === 'preserve-deterministic-artifacts' ||
    key === 'preserve-deterministic-sections' ||
    key === 'exploratory-code-changes' ||
    key === 'exploratory-wide-changes'
  ) {
    // These need the full PiLlmConfig — handled by caller
    return false;
  }
  return false;
}

export { parseBoolean };
