import type { LlmConfig, LlmProviderType } from './types.ts';

const LEMONADE_DEFAULT_URL = 'http://host.containers.internal:13305/';

export interface ActionConfig {
  readonly action: string;
  readonly model: string;
  readonly baseUrl: string;
  readonly provider: LlmProviderType;
  /** API key for the provider. 'local' for Lemonade; GITHUB_TOKEN for cloud providers. */
  readonly apiKey: string;
  /** True when the provider is openai-compat or github-models (cloud endpoint). */
  readonly isCloud: boolean;
  /** Name of the providerProfile used, or null if resolved from global config. */
  readonly profileName: string | null;
}

/**
 * Single source of truth for action → provider routing.
 *
 * Resolution order:
 *   model:    actionPolicies[action].model
 *             → providerProfiles[profile].defaultModel
 *             → actions[action]
 *             → config.defaultModel
 *             → 'Qwen3-Coder-Next-GGUF'
 *
 *   baseUrl:  providerProfiles[profile].baseUrl → config.baseUrl → lemonade default
 *   provider: providerProfiles[profile].provider → config.provider → 'lemonade'
 *   apiKey:   GITHUB_TOKEN for cloud providers, 'local' for Lemonade/LiteLLM
 */
export function resolveActionConfig(action: string, config: LlmConfig): ActionConfig {
  const actionPolicy = config.actionPolicies?.[action];
  const profileName = actionPolicy?.profile ?? null;
  const profile = profileName ? config.providerProfiles?.[profileName] : undefined;

  const model =
    actionPolicy?.model ??
    profile?.defaultModel ??
    config.actions?.[action] ??
    config.defaultModel ??
    'Qwen3-Coder-Next-GGUF';

  const rawBaseUrl = profile?.baseUrl ?? config.baseUrl ?? LEMONADE_DEFAULT_URL;

  const provider = normalizeProvider(profile?.provider ?? config.provider ?? 'lemonade');

  const isCloud = provider === 'openai-compat' || provider === 'github-models';
  const apiKey = isCloud ? (process.env.GITHUB_TOKEN ?? 'local') : 'local';

  return { action, model, baseUrl: rawBaseUrl, provider, apiKey, isCloud, profileName };
}

function normalizeProvider(raw: string | null | undefined): LlmProviderType {
  if (raw === 'litellm') return 'litellm';
  if (raw === 'openai-compat') return 'openai-compat';
  if (raw === 'github-models') return 'github-models';
  return 'lemonade';
}
