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
  /** Maximum context window advertised by the model server (tokens). */
  readonly maxContextWindow?: number;
}

/**
 * Token budget configuration. Controls how max_tokens is computed
 * when not explicitly set by the caller.
 *
 * For local hardware with large unified memory, set contextFraction close
 * to 1.0 and cap to null. For cloud providers, keep conservative defaults.
 */
/**
 * Informational catalog entry for a known model.
 * Not used for runtime routing — metadata only for documentation and tooling.
 */
export interface LlmModelCatalogEntry {
  /** Lemonade model ID as returned by the discovery API. */
  readonly id: string;
  /** Task tier: 1 = lightweight/hot, 2 = coding/docs, 3 = high-reasoning, or 'unassigned'. */
  readonly tier: 1 | 2 | 3 | 'unassigned';
  /** One-line role description. */
  readonly role: string;
  /** Actions from the `actions` map assigned to this model. */
  readonly assignedActions?: readonly string[];
  /** Context window in tokens as reported by the model server. */
  readonly contextWindow?: number;
  /** Approximate model size in GB. */
  readonly sizeGb?: number;
  /** Model labels from the discovery API. */
  readonly labels?: readonly string[];
}

export interface LlmTokenBudget {
  /**
   * Fraction of the model’s context window to use as max_tokens budget.
   * Applied when the model reports a context window (e.g. Lemonade models).
   * Range: 0.0–1.0.  Default: 0.75.
   */
  readonly contextFraction?: number;
  /**
   * Hard cap on the computed budget (tokens).
   * null or absent = no cap (recommended for local hardware).
   * Set to e.g. 8192 for cloud providers to avoid runaway costs.
   */
  readonly cap?: number | null;
  /** Budget for quick-mode calls (--quick flag). Default: 512. */
  readonly quick?: number;
  /**
   * Fallback budget when the model has no context window info
   * (typical for cloud/gateway-proxied models). Default: 4096.
   */
  readonly cloudFallback?: number;
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
  /** Token counts and speed from the server timing payload (phase: 'complete' only). */
  readonly promptTokens?: number;
  readonly completionTokens?: number;
  /** Generation speed — predicted tokens per second. */
  readonly tps?: number;
  /** Prompt-processing speed — prompt tokens per second. */
  readonly pp?: number;
}

export interface CompletionOptions {
  readonly action?: string;
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  /** Context window of the chosen model (tokens). Used to compute a sensible
   * max_tokens budget when maxTokens is not set explicitly. */
  readonly modelContextWindow?: number;
  /** Token budget policy injected from the active provider config. */
  readonly tokenBudget?: LlmTokenBudget;
  readonly minContextTokens?: number;
  readonly quick?: boolean;
  readonly timeoutMs?: number;
  readonly enableThinking?: boolean;
  readonly onProgress?: (event: CompletionProgressEvent) => void;
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

export interface LlmConfig {
  provider?: LlmProviderType | null;
  baseUrl: string | null;
  defaultModel: string | null;
  requestTimeoutMs?: number;
  actions: Record<string, string>;
  providerProfiles?: Record<string, LlmProviderProfile>;
  actionPolicies?: Record<string, LlmActionPolicy>;
  githubModel?: string | null;
  /** Token budget policy for this provider configuration. */
  tokenBudget?: LlmTokenBudget;
  /**
   * Informational model catalog. Not used for routing — metadata for docs and tooling.
   * See `.pi/SETUP.md` for the human-readable reference.
   */
  catalog?: readonly LlmModelCatalogEntry[];
  harness: LlmHarnessConfig;
}

export interface CompletionAttempt {
  readonly url: string;
  readonly ok: boolean;
  readonly status?: number;
  readonly error?: string;
  readonly empty?: boolean;
  readonly retry?: number;
}

export interface CompletionReport {
  readonly generatedAt: string;
  readonly action: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly content: string;
  readonly attempts: readonly CompletionAttempt[];
}

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

export type CompleteAgentRequest = {
  action: string;
  flags: { model?: string; noThinking?: boolean };
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  onProgress?: (event: CompletionProgressEvent) => void;
};

export type CompletionAttemptState = {
  readonly url: string;
  readonly ok: boolean;
  readonly status?: number;
  readonly error?: string;
  readonly empty?: boolean;
  readonly retry?: number;
};

type MonorepoUnitSpec = {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly rootDir: string;
  readonly description: string;
  readonly focus: string;
  readonly sessionEffect: string;
  readonly defaultMode: LlmHarnessMode;
};

export const monorepoUnitSpecs = [
  {
    name: 'delivery',
    aliases: ['docs', 'openspec', 'plan'],
    rootDir: 'openspec',
    description: 'Planning, OpenSpec changes, docs, and delivery artifacts',
    focus: 'OpenSpec-first planning, architecture alignment, docs updates, and delivery validation',
    sessionEffect:
      'Preloads planning, OpenSpec, ADR, and documentation context while keeping the shared monorepo rules and cdk workflows.',
    defaultMode: 'deterministic',
  },
  {
    name: 'implementation',
    aliases: ['repos', 'projects', 'workspaces'],
    rootDir: 'repos',
    description: 'Packages, examples, and workspace code surfaces',
    focus: 'Implementation, refactors, and validation across repos, projects, and workspace code',
    sessionEffect:
      'Preloads package, example, and workspace implementation context for broad code work and maintenance.',
    defaultMode: 'exploratory',
  },
  {
    name: 'operations',
    aliases: ['infrastructure', 'scripts'],
    rootDir: 'infrastructure',
    description: 'Infrastructure, CI, release, and operational automation',
    focus:
      'Operational maintenance for infrastructure, release flow, CI, and repository automation',
    sessionEffect:
      'Preloads infrastructure and automation context for release, CI, and operational workflows.',
    defaultMode: 'exploratory',
  },
] as const satisfies readonly MonorepoUnitSpec[];
