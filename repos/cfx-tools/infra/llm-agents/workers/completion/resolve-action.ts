import { resolveCloudCredentials } from './cloud-credentials.js';
import type { LlmConfig, LlmProviderType } from './types.js';

const LEMONADE_DEFAULT_URL = 'http://host.containers.internal:13305/';

export interface ActionConfig {
  readonly action: string;
  readonly model: string;
  readonly baseUrl: string;
  readonly provider: LlmProviderType;
  /** API key for the provider. 'local' for Lemonade; OpenRouter key or GITHUB_TOKEN for cloud providers. */
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
 *   apiKey:   OpenRouter key when OPENROUTER_API_KEY is set, else GITHUB_TOKEN
 *             for cloud providers, 'local' for Lemonade/LiteLLM
 *
 *   Cloud actions prefer OpenRouter (when OPENROUTER_API_KEY is present) and
 *   fall back to the configured Copilot/GitHub endpoint otherwise.
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
  if (!isCloud) {
    return { action, model, baseUrl: rawBaseUrl, provider, apiKey: 'local', isCloud, profileName };
  }

  const cloud = resolveCloudCredentials({ baseUrl: rawBaseUrl, model });
  // OpenRouter is OpenAI-compatible; force openai-compat semantics when active.
  const cloudProvider: LlmProviderType = cloud.source === 'openrouter' ? 'openai-compat' : provider;

  return {
    action,
    model: cloud.model,
    baseUrl: cloud.baseUrl,
    provider: cloudProvider,
    apiKey: cloud.apiKey,
    isCloud,
    profileName,
  };
}

function normalizeProvider(raw: string | null | undefined): LlmProviderType {
  if (raw === 'litellm') return 'litellm';
  if (raw === 'openai-compat') return 'openai-compat';
  if (raw === 'github-models') return 'github-models';
  return 'lemonade';
}
