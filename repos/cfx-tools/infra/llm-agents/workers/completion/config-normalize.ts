import { isRecord, isStringRecord } from './guards.ts';
import type { LlmConfig, LlmProviderType } from './types.ts';

export const DEFAULT_REQUEST_TIMEOUT_MS = 600000;

export function defaultConfig(): LlmConfig {
  return {
    provider: 'lemonade',
    baseUrl: 'http://host.containers.internal:13305/',
    defaultModel: 'Qwen3-Coder-Next-GGUF',
    githubModel: null,
    requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    actions: {},
    providerProfiles: {},
    actionPolicies: {},
    harness: {
      version: 1,
      defaultMode: 'deterministic',
      providerStrategy: 'auto',
      deterministic: {
        preserveDeterministicArtifacts: true,
        preserveDeterministicSections: true,
      },
      exploratory: {
        allowCodeChanges: true,
        allowWideChanges: true,
      },
    },
  };
}

export function normalizeConfig(value: unknown): LlmConfig {
  const defaults = defaultConfig();
  const raw = isRecord(value) ? value : {};
  const rawHarness = isRecord(raw.harness) ? raw.harness : {};
  const rawDeterministic = isRecord(rawHarness.deterministic) ? rawHarness.deterministic : {};
  const rawExploratory = isRecord(rawHarness.exploratory) ? rawHarness.exploratory : {};

  return {
    ...defaults,
    ...raw,
    provider: normalizeProviderType(raw.provider),
    baseUrl: typeof raw.baseUrl === 'string' ? raw.baseUrl : defaults.baseUrl,
    defaultModel: typeof raw.defaultModel === 'string' ? raw.defaultModel : defaults.defaultModel,
    githubModel: typeof raw.githubModel === 'string' ? raw.githubModel : defaults.githubModel,
    requestTimeoutMs:
      typeof raw.requestTimeoutMs === 'number' ? raw.requestTimeoutMs : defaults.requestTimeoutMs,
    actions: isStringRecord(raw.actions)
      ? { ...defaults.actions, ...raw.actions }
      : defaults.actions,
    providerProfiles: mergeProviderProfiles(defaults.providerProfiles, raw.providerProfiles),
    actionPolicies: mergeActionPolicies(defaults.actionPolicies, raw.actionPolicies),
    harness: {
      ...defaults.harness,
      ...rawHarness,
      providerStrategy:
        rawHarness.providerStrategy === 'gateway' ||
        rawHarness.providerStrategy === 'direct' ||
        rawHarness.providerStrategy === 'auto'
          ? rawHarness.providerStrategy
          : defaults.harness.providerStrategy,
      defaultMode:
        rawHarness.defaultMode === 'exploratory' || rawHarness.defaultMode === 'deterministic'
          ? rawHarness.defaultMode
          : defaults.harness.defaultMode,
      deterministic: {
        ...defaults.harness.deterministic,
        ...rawDeterministic,
      },
      exploratory: {
        ...defaults.harness.exploratory,
        ...rawExploratory,
      },
    },
  };
}

export function mergeConfigLayers(baseConfig: unknown, scopedConfig: unknown): LlmConfig {
  const base = normalizeConfig(baseConfig);
  const scoped = isRecord(scopedConfig) ? scopedConfig : {};
  const scopedHarness = isRecord(scoped.harness) ? scoped.harness : {};
  const scopedDeterministic = isRecord(scopedHarness.deterministic)
    ? scopedHarness.deterministic
    : {};
  const scopedExploratory = isRecord(scopedHarness.exploratory) ? scopedHarness.exploratory : {};

  return normalizeConfig({
    ...base,
    ...scoped,
    actions: isRecord(scoped.actions) ? { ...base.actions, ...scoped.actions } : base.actions,
    providerProfiles: mergeProviderProfiles(base.providerProfiles, scoped.providerProfiles),
    actionPolicies: mergeActionPolicies(base.actionPolicies, scoped.actionPolicies),
    harness: isRecord(scoped.harness)
      ? {
          ...base.harness,
          ...scopedHarness,
          deterministic: {
            ...base.harness.deterministic,
            ...scopedDeterministic,
          },
          exploratory: {
            ...base.harness.exploratory,
            ...scopedExploratory,
          },
        }
      : base.harness,
  });
}

function mergeProviderProfiles(
  baseProfiles: LlmConfig['providerProfiles'],
  overrideProfiles: unknown,
): NonNullable<LlmConfig['providerProfiles']> {
  return {
    ...normalizeProviderProfiles(baseProfiles),
    ...normalizeProviderProfiles(overrideProfiles),
  };
}

function mergeActionPolicies(
  basePolicies: LlmConfig['actionPolicies'],
  overridePolicies: unknown,
): NonNullable<LlmConfig['actionPolicies']> {
  const base = normalizeActionPolicies(basePolicies);
  const overrides = normalizeActionPolicies(overridePolicies);
  const merged: NonNullable<LlmConfig['actionPolicies']> = { ...base };

  for (const [action, policy] of Object.entries(overrides)) {
    const current = merged[action] ?? { phases: {} };
    merged[action] = {
      ...current,
      ...policy,
      phases: {
        ...(current.phases ?? {}),
        ...(policy.phases ?? {}),
      },
    };
  }

  return merged;
}

function normalizeProviderProfiles(value: unknown): NonNullable<LlmConfig['providerProfiles']> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, profile]) => isRecord(profile))
      .map(([name, profile]) => {
        const normalizedProfile: Record<string, unknown> = {};
        if (Object.prototype.hasOwnProperty.call(profile, 'provider')) {
          normalizedProfile.provider = normalizeProviderType(profile.provider);
        }
        if (Object.prototype.hasOwnProperty.call(profile, 'baseUrl')) {
          normalizedProfile.baseUrl = typeof profile.baseUrl === 'string' ? profile.baseUrl : null;
        }
        if (Object.prototype.hasOwnProperty.call(profile, 'defaultModel')) {
          normalizedProfile.defaultModel =
            typeof profile.defaultModel === 'string' ? profile.defaultModel : null;
        }
        if (Object.prototype.hasOwnProperty.call(profile, 'githubModel')) {
          normalizedProfile.githubModel =
            typeof profile.githubModel === 'string' ? profile.githubModel : null;
        }
        if (Object.prototype.hasOwnProperty.call(profile, 'requestTimeoutMs')) {
          normalizedProfile.requestTimeoutMs =
            typeof profile.requestTimeoutMs === 'number' ? profile.requestTimeoutMs : undefined;
        }
        if (Object.prototype.hasOwnProperty.call(profile, 'providerStrategy')) {
          normalizedProfile.providerStrategy =
            profile.providerStrategy === 'gateway' ||
            profile.providerStrategy === 'direct' ||
            profile.providerStrategy === 'auto'
              ? profile.providerStrategy
              : null;
        }
        return [name, normalizedProfile as NonNullable<LlmConfig['providerProfiles']>[string]];
      }),
  );
}

function normalizeActionPolicies(value: unknown): NonNullable<LlmConfig['actionPolicies']> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, policy]) => isRecord(policy))
      .map(([name, policyValue]) => {
        const policy = policyValue as Record<string, unknown>;
        const phases = isRecord(policy.phases)
          ? Object.fromEntries(
              Object.entries(policy.phases)
                .filter(([, phase]) => isRecord(phase))
                .map(([phaseName, phaseValue]) => {
                  const phase = phaseValue as Record<string, unknown>;
                  return [
                    phaseName,
                    {
                      ...(Object.prototype.hasOwnProperty.call(phase, 'profile')
                        ? { profile: typeof phase.profile === 'string' ? phase.profile : null }
                        : {}),
                      ...(Object.prototype.hasOwnProperty.call(phase, 'model')
                        ? { model: typeof phase.model === 'string' ? phase.model : null }
                        : {}),
                    },
                  ];
                }),
            )
          : {};

        return [
          name,
          {
            ...(Object.prototype.hasOwnProperty.call(policy, 'profile')
              ? { profile: typeof policy.profile === 'string' ? policy.profile : null }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(policy, 'model')
              ? { model: typeof policy.model === 'string' ? policy.model : null }
              : {}),
            phases,
          },
        ];
      }),
  );
}

function normalizeProviderType(value: unknown): LlmProviderType | null {
  if (
    value === 'lemonade' ||
    value === 'litellm' ||
    value === 'openai-compat' ||
    value === 'github-models'
  ) {
    return value;
  }
  return null;
}
