import { join, relative } from 'node:path';
import {
  defaultConfig,
  getProviderBaseUrl,
  getProviderDefaultModel,
  type LlmConfig,
  readConfig,
  resolveNamedProviderProfile,
  resolveProvider,
  resolveProviderModel,
  resolveRuntimeBridgeState,
  runPiCommit,
  runPiInteractive,
  runPiPrint,
  runPiRpc,
  writeConfig,
} from '@cfxdevkit/pi-agent';
import { relativeAgentConfigPath, resolveAgentConfigPath } from '../monorepo-units.js';
import {
  relativeParent as resolveRelativeParent,
  findRepoRoot as resolveRepoRoot,
} from '../workspace-paths.js';

export type { LlmConfig };

// Minimal interface for the llm-agents surface used by this CLI.
// Full types live in @cfxdevkit/llm-agents — this is the call-site contract.
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
  readonly runPrecommit: (args: readonly string[]) => Promise<unknown>;
  readonly runReviewAgent: () => Promise<unknown>;
  readonly runStructureUpkeep: (args: readonly string[]) => Promise<unknown>;
  readonly runTestUpkeep: (args: readonly string[]) => Promise<unknown>;
  readonly runWikiGenerate: (args: readonly string[]) => Promise<unknown>;
  readonly validateModels: (args: readonly string[]) => Promise<unknown>;
};

// Pi-agent surface — fully typed via static import (no llm-agents chain involved).
type PiAgentModule = {
  readonly runPiCommit: typeof runPiCommit;
  readonly runPiInteractive: typeof runPiInteractive;
  readonly runPiPrint: typeof runPiPrint;
  readonly runPiRpc: typeof runPiRpc;
};

// LLM client config surface — fully typed via static import.
type LlmClientModule = {
  readonly defaultConfig: typeof defaultConfig;
  readonly readConfig: typeof readConfig;
  readonly writeConfig: typeof writeConfig;
  readonly resolveNamedProviderProfile: typeof resolveNamedProviderProfile;
  readonly resolveRuntimeBridgeState: typeof resolveRuntimeBridgeState;
  readonly resolveProvider: typeof resolveProvider;
  readonly getProviderBaseUrl: typeof getProviderBaseUrl;
  readonly getProviderDefaultModel: typeof getProviderDefaultModel;
  readonly resolveProviderModel: typeof resolveProviderModel;
};

const scopedConfigEnvVar = 'CFXDEVKIT_LLM_CONFIG_PATH';

// Statically-imported pi-agent config/runtime surface
const piAgentClient: LlmClientModule = {
  defaultConfig,
  readConfig,
  writeConfig,
  resolveNamedProviderProfile,
  resolveRuntimeBridgeState,
  resolveProvider,
  getProviderBaseUrl,
  getProviderDefaultModel,
  resolveProviderModel,
};

const piAgentRuntime: PiAgentModule = {
  runPiCommit,
  runPiInteractive,
  runPiPrint,
  runPiRpc,
};

export function relativeConfigPath(scope?: string): string {
  if (scope) return relativeAgentConfigPath(scope, process.cwd());
  const repoRoot = resolveRepoRoot(process.cwd());
  return relative(process.cwd(), join(repoRoot, '.pi', 'providers.json')) || '.pi/providers.json';
}

export async function withLlmClient<T>(
  run: (client: LlmClientModule) => Promise<T> | T,
): Promise<T> {
  return runInRepoRoot(() => run(piAgentClient));
}

export async function withLlmAgents(
  run: (agents: LlmAgentsModule) => Promise<unknown> | unknown,
): Promise<void> {
  await runInRepoRoot(async () => {
    // Use `as string` to prevent TypeScript from statically resolving llm-agents
    // types (which traverse tsx .ts-extension source files incompatible with
    // standard tsc). The LlmAgentsModule interface above is the call-site contract.
    const specifier = '@cfxdevkit/llm-agents' as string;
    const agents = (await import(specifier)) as unknown as LlmAgentsModule;
    await run(agents);
  });
}

export async function withPiAgent(
  run: (agent: PiAgentModule) => Promise<unknown> | unknown,
): Promise<void> {
  await runInRepoRoot(() => run(piAgentRuntime));
}

// Alias kept for call sites that previously used the "source" variant.
export const withPiAgentSource = withPiAgent;

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
