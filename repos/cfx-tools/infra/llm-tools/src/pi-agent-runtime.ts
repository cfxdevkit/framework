export type PiAgentModule = {
  readonly runPiInteractive: (options?: {
    readonly promptArgs?: readonly string[];
  }) => Promise<void>;
  readonly runPiPrint: (options: { readonly promptArgs: readonly string[] }) => Promise<void>;
  readonly runPiRpc: () => Promise<void>;
};

const piAgentModulePath = '../../pi-agent/src/index.js';

export async function loadPiAgentModule(): Promise<PiAgentModule> {
  return (await import(piAgentModulePath)) as PiAgentModule;
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
