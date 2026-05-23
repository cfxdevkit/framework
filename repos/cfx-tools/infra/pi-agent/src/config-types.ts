export type PiLlmProviderType = 'lemonade' | 'litellm' | 'openai-compat' | 'github-models';

export type PiProviderStrategy = 'auto' | 'gateway' | 'direct';

export interface PiLlmConfig {
  readonly provider?: PiLlmProviderType | null;
  readonly baseUrl: string | null;
  readonly defaultModel: string | null;
  readonly githubModel?: string | null;
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
      readonly providerStrategy?: PiProviderStrategy | null;
    }
  >;
  readonly actionPolicies?: Record<
    string,
    {
      readonly profile?: string | null;
      readonly model?: string | null;
      readonly phases?: Record<
        string,
        { readonly profile?: string | null; readonly model?: string | null }
      >;
    }
  >;
  readonly harness: {
    readonly version: number;
    readonly defaultMode: 'deterministic' | 'exploratory';
    readonly providerStrategy: PiProviderStrategy;
    readonly deterministic: {
      readonly preserveDeterministicArtifacts: boolean;
      readonly preserveDeterministicSections: boolean;
    };
    readonly exploratory: {
      readonly allowCodeChanges: boolean;
      readonly allowWideChanges: boolean;
    };
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
    readonly providerStrategy: PiProviderStrategy;
  };
}
