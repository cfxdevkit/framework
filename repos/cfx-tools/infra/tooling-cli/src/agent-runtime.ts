import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { relativeAgentConfigPath, resolveAgentConfigPath } from './monorepo-units.js';
import {
  relativeParent as resolveRelativeParent,
  findRepoRoot as resolveRepoRoot,
} from './workspace-paths.js';

const scopedConfigEnvVar = 'CFXDEVKIT_LLM_CONFIG_PATH';
const cdkAiPackageName = '@cfxdevkit/cdk-ai';
const piAgentSourceModulePath = '../../pi-agent/src/index.js';
const llmAgentsSourceModulePath = '../../llm-agents/src/index.js';
const cdkAiDistEntry = new URL('../../../packages/cdk-ai/dist/index.js', import.meta.url);
const piAgentDistEntry = new URL('../../pi-agent/dist/index.js', import.meta.url);
const llmAgentsDistEntry = new URL('../../llm-agents/dist/index.js', import.meta.url);

function hasBuiltCdkAiRuntime(): boolean {
  // When Vite compiles the dist, new URL(..., import.meta.url) becomes data: URLs.
  // In that case module content is already inlined — treat as built.
  if (cdkAiDistEntry.protocol === 'data:') return true;
  return (
    existsSync(cdkAiDistEntry) && existsSync(piAgentDistEntry) && existsSync(llmAgentsDistEntry)
  );
}

type LlmConfig = {
  provider?: string | null;
  baseUrl: string | null;
  defaultModel: string | null;
  githubModel?: string | null;
  requestTimeoutMs?: number;
  actions: Record<string, string>;
  providerProfiles?: Record<
    string,
    {
      provider?: string | null;
      baseUrl?: string | null;
      defaultModel?: string | null;
      githubModel?: string | null;
      requestTimeoutMs?: number;
      providerStrategy?: 'auto' | 'gateway' | 'direct' | null;
    }
  >;
  actionPolicies?: Record<
    string,
    {
      profile?: string | null;
      model?: string | null;
      phases?: Record<string, { profile?: string | null; model?: string | null }>;
    }
  >;
  harness: {
    version: number;
    defaultMode: 'deterministic' | 'exploratory';
    providerStrategy: 'auto' | 'gateway' | 'direct';
    deterministic: {
      preserveDeterministicArtifacts: boolean;
      preserveDeterministicSections: boolean;
    };
    exploratory: {
      allowCodeChanges: boolean;
      allowWideChanges: boolean;
    };
  };
};

type LlmProvider = {
  readonly type: string;
  discoverModels(): Promise<readonly unknown[]>;
  chooseModel(models: readonly unknown[], preferred?: string | null): unknown;
};

type LlmClientModule = {
  readonly defaultConfig: () => LlmConfig;
  readonly readConfig: () => Promise<LlmConfig>;
  readonly writeConfig: (config: LlmConfig) => Promise<void>;
  readonly resolveNamedProviderProfile: (
    config: LlmConfig,
    profileName?: string | null,
  ) => {
    readonly name: string | null;
    readonly exists: boolean;
    readonly provider: string | null;
    readonly baseUrl: string | null;
    readonly defaultModel: string | null;
    readonly githubModel: string | null;
    readonly requestTimeoutMs: number | null;
    readonly providerStrategy: 'auto' | 'gateway' | 'direct';
  };
  readonly resolveRuntimeBridgeState: (
    scope?: string,
    options?: { action?: string; phase?: string },
  ) => Promise<{
    readonly effectivePolicy: {
      readonly action?: string;
      readonly phase?: string;
      readonly source: 'default' | 'action' | 'phase';
      readonly legacyActionModel: string | null;
      readonly model: string | null;
      readonly profile: {
        readonly name: string | null;
        readonly exists: boolean;
        readonly provider: string | null;
        readonly baseUrl: string | null;
        readonly defaultModel: string | null;
        readonly githubModel: string | null;
        readonly requestTimeoutMs: number | null;
        readonly providerStrategy: 'auto' | 'gateway' | 'direct';
      };
    };
  }>;
  readonly resolveProvider: () => Promise<LlmProvider>;
  readonly getProviderBaseUrl: (provider: LlmProvider) => string;
  readonly getProviderDefaultModel: (provider: LlmProvider) => string | null;
  readonly resolveProviderModel: (
    provider: LlmProvider,
    preferred?: string | null,
  ) => Promise<string>;
};

type LlmAgentsModule = {
  readonly configure: (args: readonly string[]) => Promise<unknown>;
  readonly listActions: () => Promise<unknown> | unknown;
  readonly listModels: () => Promise<unknown>;
  readonly runAction: (args: readonly string[]) => Promise<unknown>;
  readonly runAll: () => Promise<unknown>;
  readonly runAgentCheck: (args: readonly string[]) => Promise<unknown>;
  readonly runAgentSmoke: (args: readonly string[]) => Promise<unknown>;
  readonly runCommit: (args: readonly string[]) => Promise<unknown>;
  readonly runDocsApi: (args: readonly string[]) => Promise<unknown>;
  readonly runDocsApiProbe: (args: readonly string[]) => Promise<unknown>;
  readonly runDocsPackagePages: (args: readonly string[]) => Promise<unknown>;
  readonly runDocsReadme: (args: readonly string[]) => Promise<unknown>;
  readonly runDocsUpkeep: (args: readonly string[]) => Promise<unknown>;
  readonly runPrecommit: (args: readonly string[]) => Promise<unknown>;
  readonly runReviewAgent: () => Promise<unknown>;
  readonly runStructureUpkeep: (args: readonly string[]) => Promise<unknown>;
  readonly runTestUpkeep: (args: readonly string[]) => Promise<unknown>;
  readonly validateModels: (args: readonly string[]) => Promise<unknown>;
};

type PiAgentModule = {
  readonly runPiCommit: (options?: {
    readonly scope?: string;
    readonly promptArgs?: readonly string[];
  }) => Promise<void>;
  readonly runPiInteractive: (options?: {
    readonly scope?: string;
    readonly promptArgs?: readonly string[];
  }) => Promise<void>;
  readonly runPiPrint: (options: {
    readonly scope?: string;
    readonly promptArgs: readonly string[];
  }) => Promise<void>;
  readonly runPiRpc: (options?: { readonly scope?: string }) => Promise<void>;
};

export function relativeConfigPath(scope?: string): string {
  if (scope) return relativeAgentConfigPath(scope, process.cwd());
  const repoRoot = resolveRepoRoot(process.cwd());
  return relative(process.cwd(), join(repoRoot, '.pi', 'providers.json')) || '.pi/providers.json';
}

export async function withLlmClient<T>(
  run: (client: LlmClientModule) => Promise<T> | T,
): Promise<T> {
  return runInRepoRoot(async () =>
    run(
      await loadWorkspaceModule<LlmClientModule>(
        cdkAiPackageName,
        piAgentSourceModulePath,
        cdkAiDistEntry,
      ),
    ),
  );
}

export async function withLlmAgents(
  run: (agents: LlmAgentsModule) => Promise<unknown> | unknown,
): Promise<void> {
  await runInRepoRoot(async () => {
    await run(
      await loadWorkspaceModule<LlmAgentsModule>(
        cdkAiPackageName,
        llmAgentsSourceModulePath,
        cdkAiDistEntry,
      ),
    );
  });
}

export async function withPiAgent(
  run: (piAgent: PiAgentModule) => Promise<unknown> | unknown,
): Promise<void> {
  await runInRepoRoot(async () => {
    await run(
      await loadWorkspaceModule<PiAgentModule>(
        cdkAiPackageName,
        piAgentSourceModulePath,
        cdkAiDistEntry,
      ),
    );
  });
}

export async function withPiAgentSource(
  run: (piAgent: PiAgentModule) => Promise<unknown> | unknown,
): Promise<void> {
  await runInRepoRoot(async () => {
    // In compiled dist (Vite inlines data: URLs), source path resolution is invalid.
    // Fall back to the package specifier, which re-exports everything from pi-agent.
    const mod =
      cdkAiDistEntry.protocol === 'data:'
        ? await import(cdkAiPackageName)
        : await import(piAgentSourceModulePath);
    await run(mod as PiAgentModule);
  });
}

async function loadWorkspaceModule<T>(
  packageSpecifier: string,
  sourceSpecifier: string,
  builtEntry: URL,
): Promise<T> {
  if (builtEntry.href === cdkAiDistEntry.href && hasBuiltCdkAiRuntime()) {
    return (await import(packageSpecifier)) as T;
  }

  if (builtEntry.href !== cdkAiDistEntry.href && existsSync(builtEntry)) {
    return (await import(packageSpecifier)) as T;
  }

  return (await import(sourceSpecifier)) as T;
}

export async function withAgentScope<T>(
  scope: string | undefined,
  work: () => Promise<T> | T,
): Promise<T> {
  if (!scope) return await work();

  const previousValue = process.env[scopedConfigEnvVar];
  process.env[scopedConfigEnvVar] = resolveAgentConfigPath(scope, process.cwd());
  try {
    return await work();
  } finally {
    if (previousValue === undefined) {
      delete process.env[scopedConfigEnvVar];
    } else {
      process.env[scopedConfigEnvVar] = previousValue;
    }
  }
}

export async function runInRepoRoot<T>(work: () => Promise<T> | T): Promise<T> {
  const previousCwd = process.cwd();
  const repoRoot = resolveRepoRoot(previousCwd);
  if (repoRoot === previousCwd) return await work();

  process.chdir(repoRoot);
  try {
    return await work();
  } finally {
    process.chdir(previousCwd);
  }
}

export function findRepoRoot(startDir: string): string {
  return resolveRepoRoot(startDir);
}

export function relativeParent(path: string): string {
  return resolveRelativeParent(path);
}

export function isUnknownWorkflowError(
  error: unknown,
  mode: 'deterministic' | 'exploratory',
): boolean {
  return error instanceof Error && error.message.startsWith(`Unknown ${mode} workflow:`);
}

export function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}

export function parseBoolean(value: string | undefined, key: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${key} must be true or false`);
}

export function formatBoolean(value: boolean): string {
  return value ? 'yes' : 'no';
}
