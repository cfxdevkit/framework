const llmClientModulePath = '../../llm-client/src/index.js';

export type PiLlmProviderType = 'lemonade' | 'litellm' | 'openai-compat' | 'github-models';

export interface PiLlmModel {
  readonly id?: string;
  readonly checkpoint?: string;
  readonly labels?: readonly string[];
  readonly recipe?: string;
  readonly size?: number;
  readonly suggested?: boolean;
  readonly baseUrl?: string;
}

export interface PiLlmConfig {
  readonly provider?: PiLlmProviderType | null;
  readonly baseUrl: string | null;
  readonly defaultModel: string | null;
  readonly requestTimeoutMs?: number;
  readonly actions: Record<string, string>;
  readonly providerProfiles?: Record<
    string,
    {
      readonly provider?: PiLlmProviderType | null;
      readonly baseUrl?: string | null;
      readonly defaultModel?: string | null;
      readonly githubModel?: string | null;
      readonly requestTimeoutMs?: number;
      readonly providerStrategy?: 'auto' | 'gateway' | 'direct' | null;
    }
  >;
  readonly actionPolicies?: Record<
    string,
    {
      readonly profile?: string | null;
      readonly model?: string | null;
      readonly phases?: Record<string, { readonly profile?: string | null; readonly model?: string | null }>;
    }
  >;
  readonly harness?: {
    readonly providerStrategy?: 'auto' | 'gateway' | 'direct';
  };
}

export interface PiEffectiveActionPolicy {
  readonly action?: string;
  readonly phase?: string;
  readonly source: 'default' | 'action' | 'phase';
  readonly legacyActionModel: string | null;
  readonly model: string | null;
  readonly profile: {
    readonly name: string | null;
    readonly exists: boolean;
    readonly provider: PiLlmProviderType | null;
    readonly baseUrl: string | null;
    readonly defaultModel: string | null;
    readonly githubModel: string | null;
    readonly requestTimeoutMs: number | null;
    readonly providerStrategy: 'auto' | 'gateway' | 'direct';
  };
}

interface PiResolvedProvider {
  readonly type: PiLlmProviderType;
  readonly discoverModels: () => Promise<readonly PiLlmModel[]>;
}

interface LlmClientModule {
  readonly readConfig: () => Promise<PiLlmConfig>;
  readonly resolveProvider: () => Promise<PiResolvedProvider>;
  readonly resolveEffectiveActionPolicy: (
    config: PiLlmConfig,
    options?: { action?: string; phase?: string },
  ) => PiEffectiveActionPolicy;
  readonly getProviderBaseUrl: (provider: PiResolvedProvider) => string | null | undefined;
  readonly getProviderDefaultModel: (provider: PiResolvedProvider) => string | null | undefined;
}

export async function loadLlmClientModule(): Promise<LlmClientModule> {
  return (await import(llmClientModulePath)) as LlmClientModule;
}
