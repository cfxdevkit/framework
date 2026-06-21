import type { PiLlmConfig, PiLlmProviderType, PiProviderStrategy } from '../config/types.js';

const defaultRequestTimeoutMs = 600000;

export function defaultPiConfig(): PiLlmConfig {
  return {
    provider: 'openai-compat',
    baseUrl: 'http://localhost:28787/v1/',
    defaultModel: 'Qwen3.6-35B-A3B-MTP-GGUF-Q8_0',
    githubModel: null,
    requestTimeoutMs: defaultRequestTimeoutMs,
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

export function normalizePiConfig(value: unknown): PiLlmConfig {
  const defaults = defaultPiConfig();
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
      providerStrategy: normalizeProviderStrategy(
        rawHarness.providerStrategy,
        defaults.harness.providerStrategy,
      ),
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

export function mergePiConfigLayers(baseConfig: unknown, scopedConfig: unknown): PiLlmConfig {
  const base = normalizePiConfig(baseConfig);
  const scoped = isRecord(scopedConfig) ? scopedConfig : {};
  const scopedHarness = isRecord(scoped.harness) ? scoped.harness : {};
  const scopedDeterministic = isRecord(scopedHarness.deterministic)
    ? scopedHarness.deterministic
    : {};
  const scopedExploratory = isRecord(scopedHarness.exploratory) ? scopedHarness.exploratory : {};

  return normalizePiConfig({
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

function normalizeProviderType(value: unknown): PiLlmProviderType | null {
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

function normalizeProviderStrategy(
  value: unknown,
  defaultValue: PiProviderStrategy,
): PiProviderStrategy {
  if (value === 'gateway' || value === 'direct' || value === 'auto') {
    return value;
  }
  return defaultValue;
}

function mergeProviderProfiles(
  baseProfiles: PiLlmConfig['providerProfiles'],
  overrideProfiles: unknown,
): NonNullable<PiLlmConfig['providerProfiles']> {
  return {
    ...normalizeProviderProfiles(baseProfiles),
    ...normalizeProviderProfiles(overrideProfiles),
  };
}

function mergeActionPolicies(
  basePolicies: PiLlmConfig['actionPolicies'],
  overridePolicies: unknown,
): NonNullable<PiLlmConfig['actionPolicies']> {
  const base = normalizeActionPolicies(basePolicies);
  const overrides = normalizeActionPolicies(overridePolicies);
  const merged: NonNullable<PiLlmConfig['actionPolicies']> = { ...base };

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

function normalizeProviderProfiles(value: unknown): NonNullable<PiLlmConfig['providerProfiles']> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, profile]) => isRecord(profile))
      .map(([name, profile]: [string, Record<string, unknown>]) => {
        const normalizedProfile: Record<string, unknown> = {};
        if (Object.hasOwn(profile, 'provider')) {
          normalizedProfile.provider = normalizeProviderType(profile.provider);
        }
        if (Object.hasOwn(profile, 'baseUrl')) {
          normalizedProfile.baseUrl = typeof profile.baseUrl === 'string' ? profile.baseUrl : null;
        }
        if (Object.hasOwn(profile, 'defaultModel')) {
          normalizedProfile.defaultModel =
            typeof profile.defaultModel === 'string' ? profile.defaultModel : null;
        }
        if (Object.hasOwn(profile, 'githubModel')) {
          normalizedProfile.githubModel =
            typeof profile.githubModel === 'string' ? profile.githubModel : null;
        }
        if (Object.hasOwn(profile, 'requestTimeoutMs')) {
          normalizedProfile.requestTimeoutMs =
            typeof profile.requestTimeoutMs === 'number' ? profile.requestTimeoutMs : undefined;
        }
        if (Object.hasOwn(profile, 'providerStrategy')) {
          normalizedProfile.providerStrategy = normalizeNullableProviderStrategy(
            profile.providerStrategy,
          );
        }
        return [name, normalizedProfile as NonNullable<PiLlmConfig['providerProfiles']>[string]];
      }),
  );
}

function normalizeNullableProviderStrategy(value: unknown): PiProviderStrategy | null {
  if (value === 'gateway' || value === 'direct' || value === 'auto') {
    return value;
  }
  return null;
}

function normalizeActionPolicies(value: unknown): NonNullable<PiLlmConfig['actionPolicies']> {
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
                      ...(Object.hasOwn(phase, 'profile')
                        ? { profile: typeof phase.profile === 'string' ? phase.profile : null }
                        : {}),
                      ...(Object.hasOwn(phase, 'model')
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
            ...(Object.hasOwn(policy, 'profile')
              ? { profile: typeof policy.profile === 'string' ? policy.profile : null }
              : {}),
            ...(Object.hasOwn(policy, 'model')
              ? { model: typeof policy.model === 'string' ? policy.model : null }
              : {}),
            phases,
          },
        ];
      }),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');
}
