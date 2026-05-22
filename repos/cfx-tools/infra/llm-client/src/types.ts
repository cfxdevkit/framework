export type LlmProviderType = 'lemonade' | 'litellm' | 'openai-compat' | 'github-models';
export type LlmHarnessMode = 'deterministic' | 'exploratory';
export type LlmProviderStrategy = 'auto' | 'gateway' | 'direct';

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

export interface LlmConfig {
  provider?: LlmProviderType | null;
  baseUrl: string | null;
  defaultModel: string | null;
  requestTimeoutMs?: number;
  actions: Record<string, string>;
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
