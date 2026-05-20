export type LlmProviderType = 'lemonade' | 'openai-compat' | 'github-models';

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
  readonly quick?: boolean;
}

export interface LlmProvider {
  readonly type: LlmProviderType;
  complete(messages: readonly ChatMessage[], opts?: CompletionOptions): Promise<string>;
  discoverModels(): Promise<readonly LlmModel[]>;
  chooseModel(models: readonly LlmModel[], preferred?: string | null): LlmModel | undefined;
}

export interface LlmConfig {
  baseUrl: string | null;
  defaultModel: string | null;
  actions: Record<string, string>;
  githubModel?: string | null;
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
}

export interface ResolveProviderAttempt {
  readonly step: string;
  readonly ok: boolean;
  readonly detail: string;
}
