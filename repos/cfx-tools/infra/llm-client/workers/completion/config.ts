import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type {
  LlmActionPhasePolicy,
  LlmActionPolicy,
  LlmProviderProfile,
} from '../../src/types.ts';
import {
  configPath,
  configPathEnvVar,
  legacyCompatConfigPath,
  legacyConfigPath,
} from '../shared/index.ts';

export const DEFAULT_REQUEST_TIMEOUT_MS = 120000;

export async function readConfig() {
  const baseConfig = await readBaseConfig();
  const scopedPath = process.env[configPathEnvVar];
  if (
    !scopedPath ||
    scopedPath === configPath ||
    scopedPath === legacyConfigPath ||
    scopedPath === legacyCompatConfigPath
  ) {
    return baseConfig;
  }

  const scopedConfig = await readConfigFile(scopedPath);
  if (!scopedConfig) return baseConfig;
  return mergeConfigLayers(baseConfig, scopedConfig);
}

export async function writeConfig(config) {
  const targetPath = process.env[configPathEnvVar] || configPath;
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(normalizeConfig(config), null, 2)}\n`, 'utf8');
}

export function mergeConfigLayers(baseConfig, scopedConfig) {
  const base = normalizeConfig(baseConfig);
  const scoped = scopedConfig && typeof scopedConfig === 'object' ? scopedConfig : {};
  const scopedHarness = scoped.harness && typeof scoped.harness === 'object' ? scoped.harness : {};
  const scopedDeterministic =
    scopedHarness.deterministic && typeof scopedHarness.deterministic === 'object'
      ? scopedHarness.deterministic
      : {};
  const scopedExploratory =
    scopedHarness.exploratory && typeof scopedHarness.exploratory === 'object'
      ? scopedHarness.exploratory
      : {};

  return normalizeConfig({
    ...base,
    ...scoped,
    actions:
      scoped.actions && typeof scoped.actions === 'object'
        ? { ...base.actions, ...scoped.actions }
        : base.actions,
    providerProfiles: mergeProviderProfiles(base.providerProfiles, scoped.providerProfiles),
    actionPolicies: mergeActionPolicies(base.actionPolicies, scoped.actionPolicies),
    harness:
      scoped.harness && typeof scoped.harness === 'object'
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

export function defaultConfig() {
  return {
    provider: 'litellm',
    baseUrl: null,
    defaultModel: null,
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

export function normalizeConfig(config) {
  const defaults = defaultConfig();
  const raw = config && typeof config === 'object' ? config : {};
  const rawHarness = raw.harness && typeof raw.harness === 'object' ? raw.harness : {};
  const rawDeterministic =
    rawHarness.deterministic && typeof rawHarness.deterministic === 'object'
      ? rawHarness.deterministic
      : {};
  const rawExploratory =
    rawHarness.exploratory && typeof rawHarness.exploratory === 'object'
      ? rawHarness.exploratory
      : {};

  return {
    ...defaults,
    ...raw,
    actions:
      raw.actions && typeof raw.actions === 'object'
        ? { ...defaults.actions, ...raw.actions }
        : defaults.actions,
    providerProfiles: mergeProviderProfiles(defaults.providerProfiles, raw.providerProfiles),
    actionPolicies: mergeActionPolicies(defaults.actionPolicies, raw.actionPolicies),
    harness: {
      ...defaults.harness,
      ...rawHarness,
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

async function readBaseConfig() {
  const primaryConfig = await readConfigFile(configPath);
  if (primaryConfig) return normalizeConfig(primaryConfig);

  const legacyConfig = await readConfigFile(legacyConfigPath);
  if (legacyConfig) return normalizeConfig(legacyConfig);

  const legacyCompatConfig = await readConfigFile(legacyCompatConfigPath);
  if (legacyCompatConfig) return normalizeConfig(legacyCompatConfig);

  return defaultConfig();
}

async function readConfigFile(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

function mergeProviderProfiles(
  baseProfiles: Record<string, LlmProviderProfile> | undefined,
  overrideProfiles: Record<string, LlmProviderProfile> | undefined,
): Record<string, LlmProviderProfile> {
  return {
    ...normalizeProviderProfiles(baseProfiles),
    ...normalizeProviderProfiles(overrideProfiles),
  };
}

function mergeActionPolicies(
  basePolicies: Record<string, LlmActionPolicy> | undefined,
  overridePolicies: Record<string, LlmActionPolicy> | undefined,
): Record<string, LlmActionPolicy> {
  const base = normalizeActionPolicies(basePolicies);
  const overrides = normalizeActionPolicies(overridePolicies);
  const merged: Record<string, LlmActionPolicy> = { ...base };

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

function normalizeProviderProfiles(value: unknown): Record<string, LlmProviderProfile> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, profile]) => profile && typeof profile === 'object')
      .map(([name, profile]) => {
        const typedProfile = profile as Record<string, unknown>;
        const normalizedProfile: LlmProviderProfile = {};
        if (Object.prototype.hasOwnProperty.call(typedProfile, 'provider')) {
          normalizedProfile.provider = typedProfile.provider as LlmProviderProfile['provider'];
        }
        if (Object.prototype.hasOwnProperty.call(typedProfile, 'baseUrl')) {
          normalizedProfile.baseUrl = typedProfile.baseUrl as LlmProviderProfile['baseUrl'];
        }
        if (Object.prototype.hasOwnProperty.call(typedProfile, 'defaultModel')) {
          normalizedProfile.defaultModel =
            typedProfile.defaultModel as LlmProviderProfile['defaultModel'];
        }
        if (Object.prototype.hasOwnProperty.call(typedProfile, 'githubModel')) {
          normalizedProfile.githubModel =
            typedProfile.githubModel as LlmProviderProfile['githubModel'];
        }
        if (Object.prototype.hasOwnProperty.call(typedProfile, 'requestTimeoutMs')) {
          normalizedProfile.requestTimeoutMs =
            typedProfile.requestTimeoutMs as LlmProviderProfile['requestTimeoutMs'];
        }
        if (Object.prototype.hasOwnProperty.call(typedProfile, 'providerStrategy')) {
          normalizedProfile.providerStrategy =
            typedProfile.providerStrategy as LlmProviderProfile['providerStrategy'];
        }
        return [name, normalizedProfile];
      }),
  );
}

function normalizeActionPolicies(value: unknown): Record<string, LlmActionPolicy> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, policy]) => policy && typeof policy === 'object')
      .map(([action, policy]) => {
        const typedPolicy = policy as Record<string, unknown>;
        const phases =
          typedPolicy.phases && typeof typedPolicy.phases === 'object'
            ? Object.fromEntries(
                Object.entries(typedPolicy.phases)
                  .filter(([, phasePolicy]) => phasePolicy && typeof phasePolicy === 'object')
                  .map(([phase, phasePolicy]) => {
                    const typedPhasePolicy = phasePolicy as Record<string, unknown>;
                    const normalizedPhasePolicy: LlmActionPhasePolicy = {};
                    if (Object.prototype.hasOwnProperty.call(typedPhasePolicy, 'profile')) {
                      normalizedPhasePolicy.profile =
                        typedPhasePolicy.profile as LlmActionPhasePolicy['profile'];
                    }
                    if (Object.prototype.hasOwnProperty.call(typedPhasePolicy, 'model')) {
                      normalizedPhasePolicy.model =
                        typedPhasePolicy.model as LlmActionPhasePolicy['model'];
                    }
                    return [phase, normalizedPhasePolicy];
                  }),
              )
            : {};

        const normalizedPolicy: LlmActionPolicy = {
          phases,
        };
        if (Object.prototype.hasOwnProperty.call(typedPolicy, 'profile')) {
          normalizedPolicy.profile = typedPolicy.profile as LlmActionPolicy['profile'];
        }
        if (Object.prototype.hasOwnProperty.call(typedPolicy, 'model')) {
          normalizedPolicy.model = typedPolicy.model as LlmActionPolicy['model'];
        }

        return [action, normalizedPolicy];
      }),
  );
}