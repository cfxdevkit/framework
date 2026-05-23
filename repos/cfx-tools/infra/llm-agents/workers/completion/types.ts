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
  maxTokens: number;
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
