import { existsSync } from 'node:fs';

export type PiAgentModule = {
  readonly runPiInteractive: (options?: {
    readonly promptArgs?: readonly string[];
  }) => Promise<void>;
  readonly runPiPrint: (options: { readonly promptArgs: readonly string[] }) => Promise<void>;
  readonly runPiRpc: () => Promise<void>;
};

export type RepoAgentsModule = {
  readonly configure: (args: readonly string[]) => Promise<unknown>;
  readonly listActions: () => Promise<unknown> | unknown;
  readonly listModels: () => Promise<unknown>;
  readonly runAction: (args: readonly string[]) => Promise<unknown>;
  readonly runAll: () => Promise<unknown>;
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

const cdkAiPackageName = '@cfxdevkit/cdk-ai';
const cdkAiDistEntry = new URL('../../../packages/cdk-ai/dist/index.js', import.meta.url);
const piAgentDistEntry = new URL('../../pi-agent/dist/index.js', import.meta.url);
const llmAgentsDistEntry = new URL('../../llm-agents/dist/index.js', import.meta.url);
const piAgentSourceModulePath = '../../pi-agent/src/index.js';
const llmAgentsSourceModulePath = '../../llm-agents/src/index.js';

function hasBuiltCdkAiRuntime(): boolean {
  return (
    existsSync(cdkAiDistEntry) && existsSync(piAgentDistEntry) && existsSync(llmAgentsDistEntry)
  );
}

export async function loadPiAgentModule(): Promise<PiAgentModule> {
  if (hasBuiltCdkAiRuntime()) {
    return (await import(cdkAiPackageName)) as PiAgentModule;
  }

  return (await import(piAgentSourceModulePath)) as PiAgentModule;
}

export async function loadRepoAgentsModule(): Promise<RepoAgentsModule> {
  if (hasBuiltCdkAiRuntime()) {
    return (await import(cdkAiPackageName)) as RepoAgentsModule;
  }

  return (await import(llmAgentsSourceModulePath)) as RepoAgentsModule;
}

export async function runPiCompatibilityMode(
  workerArgs: readonly string[],
  promptArgs: readonly string[],
): Promise<void> {
  const piAgent = await loadPiAgentModule();
  const [mode] = workerArgs;

  if (mode === 'interactive') {
    await piAgent.runPiInteractive({ promptArgs });
    return;
  }

  if (mode === 'print') {
    await piAgent.runPiPrint({ promptArgs });
    return;
  }

  if (mode === 'rpc') {
    await piAgent.runPiRpc();
    return;
  }

  throw new Error(`Unknown PI runtime mode: ${mode}`);
}
