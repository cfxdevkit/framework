export type LlmProviderType = 'lemonade' | 'litellm' | 'openai-compat' | 'github-models';
export type LlmHarnessMode = 'deterministic' | 'exploratory';
export type LlmProviderStrategy = 'auto' | 'gateway' | 'direct';

export interface MonorepoUnit {
  readonly name: string;
  readonly rootDir: string;
  readonly description: string;
  readonly focus: string;
  readonly defaultMode: LlmHarnessMode;
  readonly rootPath: string;
  readonly relativeRootPath: string;
  readonly configPath: string;
  readonly relativeConfigPath: string;
}

export interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

export interface LlmModel {
  readonly id?: string;
  readonly checkpoint?: string;
  readonly labels?: readonly string[];
  readonly recipe?: string;
  readonly size?: number;
  readonly suggested?: boolean;
  readonly baseUrl?: string;
}

export interface CompletionOptions {
  readonly action?: string;
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly minContextTokens?: number;
  readonly quick?: boolean;
  readonly timeoutMs?: number;
  readonly enableThinking?: boolean;
  readonly onProgress?: (event: CompletionProgressEvent) => void;
}

export interface CompletionProgressEvent {
  readonly phase: 'request' | 'headers' | 'reasoning' | 'content' | 'heartbeat' | 'complete';
  readonly url: string;
  readonly attempt: number;
  readonly elapsedMs: number;
  readonly status?: number;
  readonly contentChars?: number;
  readonly reasoningChars?: number;
  readonly finishReason?: string;
}

export interface LlmProvider {
  readonly type: LlmProviderType;
  complete(messages: readonly ChatMessage[], opts?: CompletionOptions): Promise<string>;
  discoverModels(): Promise<readonly LlmModel[]>;
  chooseModel(models: readonly LlmModel[], preferred?: string | null): LlmModel | undefined;
}

export interface LlmHarnessConfig {
  version: 1;
  defaultMode: LlmHarnessMode;
  providerStrategy: LlmProviderStrategy;
  deterministic: {
    preserveDeterministicArtifacts: boolean;
    preserveDeterministicSections: boolean;
  };
  exploratory: {
    allowCodeChanges: boolean;
    allowWideChanges: boolean;
  };
}

export interface LlmProviderProfile {
  provider?: LlmProviderType | null;
  baseUrl?: string | null;
  defaultModel?: string | null;
  githubModel?: string | null;
  requestTimeoutMs?: number;
  providerStrategy?: LlmProviderStrategy | null;
}

export interface LlmActionPhasePolicy {
  profile?: string | null;
  model?: string | null;
}

export interface LlmActionPolicy extends LlmActionPhasePolicy {
  phases?: Record<string, LlmActionPhasePolicy>;
}

export interface LlmResolvedProviderProfile {
  readonly name: string | null;
  readonly exists: boolean;
  readonly provider: LlmProviderType | null;
  readonly baseUrl: string | null;
  readonly defaultModel: string | null;
  readonly githubModel: string | null;
  readonly requestTimeoutMs: number | null;
  readonly providerStrategy: LlmProviderStrategy;
}

export interface LlmEffectiveActionPolicy {
  readonly action?: string;
  readonly phase?: string;
  readonly source: 'default' | 'action' | 'phase';
  readonly legacyActionModel: string | null;
  readonly profile: LlmResolvedProviderProfile;
  readonly model: string | null;
}

export interface LlmConfig {
  provider?: LlmProviderType | null;
  baseUrl: string | null;
  defaultModel: string | null;
  requestTimeoutMs?: number;
  actions: Record<string, string>;
  providerProfiles?: Record<string, LlmProviderProfile>;
  actionPolicies?: Record<string, LlmActionPolicy>;
  githubModel?: string | null;
  harness: LlmHarnessConfig;
}

export interface CompletionReport {
  readonly generatedAt: string;
  readonly action: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly content: string;
  readonly attempts: readonly CompletionAttempt[];
}

export interface CompletionAttempt {
  readonly url: string;
  readonly ok: boolean;
  readonly status?: number;
  readonly error?: string;
  readonly empty?: boolean;
  readonly retry?: number;
}

export interface ResolveProviderAttempt {
  readonly step: string;
  readonly ok: boolean;
  readonly detail: string;
}

export interface LlmRuntimeBridgeState {
  readonly scope?: string;
  readonly unit: MonorepoUnit | null;
  readonly configPath: string;
  readonly config: LlmConfig;
  readonly providerType: LlmProviderType;
  readonly providerBaseUrl: string | null;
  readonly defaultModel: string | null;
  readonly models: readonly LlmModel[];
  readonly providerStrategy: LlmProviderStrategy;
  readonly effectivePolicy: LlmEffectiveActionPolicy;
}
