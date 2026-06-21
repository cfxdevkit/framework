import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findWorkspaceRoot } from '@cfxdevkit/workspace-utils';
import type { PiScopeName } from './extension.js';
import { createPiAgentExtension, piScopeEnvVar } from './extension.js';
import { createPiProviderBridge } from './providers.js';

export interface PiTerminalPhaseHooks {
  readonly beforeStart?: () => Promise<void> | void;
  readonly afterExit?: () => Promise<void> | void;
}

export interface PiAgentSessionOptions {
  readonly scope?: PiScopeName;
  readonly promptArgs?: readonly string[];
  readonly terminalPhases?: PiTerminalPhaseHooks;
}

export interface PiAgentPrintOptions extends PiAgentSessionOptions {
  readonly promptArgs: readonly string[];
}

export interface PiAgentRpcOptions extends PiAgentSessionOptions {}

export interface PiAgentCommitOptions extends PiAgentSessionOptions {}

export async function runPiInteractive(options: PiAgentSessionOptions = {}): Promise<void> {
  const extension = createPiAgentExtension(options.scope);
  const providerBridge = await createPiProviderBridge(options.scope);
  await runPiCli({
    mode: 'interactive',
    promptArgs: options.promptArgs ?? [],
    extension,
    providerBridge,
    terminalPhases: options.terminalPhases,
  });
}

export async function runPiPrint(options: PiAgentPrintOptions): Promise<void> {
  const extension = createPiAgentExtension(options.scope);
  const providerBridge = await createPiProviderBridge(options.scope);
  await runPiCli({
    mode: 'print',
    promptArgs: options.promptArgs,
    extension,
    providerBridge,
    terminalPhases: options.terminalPhases,
  });
}

export async function runPiRpc(options: PiAgentRpcOptions = {}): Promise<void> {
  const extension = createPiAgentExtension(options.scope);
  const providerBridge = await createPiProviderBridge(options.scope);
  await runPiCli({
    mode: 'rpc',
    promptArgs: [],
    extension,
    providerBridge,
    terminalPhases: options.terminalPhases,
  });
}

export async function runPiCommit(options: PiAgentCommitOptions = {}): Promise<void> {
  await runPiInteractive({
    scope: options.scope,
    promptArgs: [buildCommitSessionPrompt(options.promptArgs ?? [])],
  });
}

interface PiCliRunOptions {
  readonly mode: 'interactive' | 'print' | 'rpc';
  readonly promptArgs: readonly string[];
  readonly extension: ReturnType<typeof createPiAgentExtension>;
  readonly providerBridge: Awaited<ReturnType<typeof createPiProviderBridge>>;
  readonly terminalPhases?: PiTerminalPhaseHooks;
}

interface SpawnPnpmOptions {
  readonly mode: 'interactive' | 'print' | 'rpc';
}

async function runPiCli(options: PiCliRunOptions): Promise<void> {
  const repoRoot = findRepoRoot(process.cwd());
  const piBinaryPath = resolvePiBinaryPath();
  const extensionPath = join(repoRoot, '.pi', 'extensions', 'repo-agent.ts');
  const args = ['-e', extensionPath];

  if (options.mode === 'print') {
    args.push('--print');
  }
  if (options.mode === 'rpc') {
    args.push('--mode', 'rpc');
  }

  args.push('--provider', options.providerBridge.pi.provider);
  if (options.providerBridge.pi.model) {
    args.push('--model', options.providerBridge.pi.model);
  }
  if (options.promptArgs.length > 0) {
    args.push(options.promptArgs.join(' '));
  }

  const exitCode = await withTerminalPhases(
    options.terminalPhases,
    async () =>
      await spawnPnpm(piBinaryPath, args, repoRoot, {
        mode: options.mode,
        env: {
          ...process.env,
          PATH: prependPathEntries(process.env.PATH, [
            resolvePiAgentBinDir(),
            dirname(piBinaryPath),
          ]),
          CFXDEVKIT_LLM_CONFIG_PATH: options.providerBridge.configPath,
          ...(options.providerBridge.scope
            ? { [piScopeEnvVar]: options.providerBridge.scope }
            : {}),
          ...options.providerBridge.pi.env,
        },
      }),
  );

  if (exitCode !== 0) {
    throw new Error(
      `PI ${options.mode} mode exited with code ${exitCode} for ${options.extension.name}`,
    );
  }
}

async function spawnPnpm(
  command: string,
  args: readonly string[],
  cwd: string,
  options: SpawnPnpmOptions & { readonly env: NodeJS.ProcessEnv },
): Promise<number> {
  return await new Promise((resolve, reject) => {
    // Use 'script' to create a pseudo-TTY when spawning the PI binary in interactive mode.
    // This ensures PI detects a TTY and launches the interactive TUI even
    // when the parent process is not connected to a TTY (e.g., in containers).
    // For print and RPC modes, use direct spawn without TTY overhead.
    let child: ReturnType<typeof spawn>;

    if (options.mode === 'interactive') {
      child = spawn(
        'script',
        ['-qc', [command, ...args].map((a) => JSON.stringify(a)).join(' '), '/dev/null'],
        {
          cwd,
          env: options.env,
          stdio: 'inherit',
        },
      );
    } else {
      child = spawn(command, args, {
        cwd,
        env: options.env,
        stdio: 'inherit',
      });
    }

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }
      resolve(code ?? 1);
    });
  });
}

// Terminal ownership must stay exclusive by phase:
// 1. optional prompt/setup hooks (for example Inquirer) fully resolve and restore stdin state
// 2. PI takes over stdio for the main TUI / interactive session
// 3. optional post-session hooks run only after the PI subprocess exits
async function withTerminalPhases<T>(
  phases: PiTerminalPhaseHooks | undefined,
  run: () => Promise<T>,
): Promise<T> {
  await phases?.beforeStart?.();
  const result = await run();
  await phases?.afterExit?.();
  return result;
}

function resolvePiBinaryPath(): string {
  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const packageDir = join(currentFileDir, '..');
  const binaryName = process.platform === 'win32' ? 'pi.cmd' : 'pi';
  return join(packageDir, 'node_modules', '.bin', binaryName);
}

function resolvePiAgentBinDir(): string {
  return join(homedir(), '.pi', 'agent', 'bin');
}

function prependPathEntries(currentPath: string | undefined, entries: readonly string[]): string {
  const pathEntries = currentPath ? currentPath.split(':') : [];
  const nextEntries = [...entries.filter(Boolean), ...pathEntries];
  return [...new Set(nextEntries)].join(':');
}

function buildCommitSessionPrompt(promptArgs: readonly string[]): string {
  const operatorContext =
    promptArgs.length > 0 ? `\n\nOperator context: ${promptArgs.join(' ')}` : '';
  return (
    [
      'Start an interactive repository commit session.',
      'Run /repo-commit to begin or rerun the commit workflow inside PI.',
      'Inspect repository-policy and quality-gate status, keep the session open for remediation, and stop before final commit approval.',
      'Use the shared repository workflows and remain in the PI session while issues are resolved.',
    ].join(' ') + operatorContext
  );
}

function findRepoRoot(startDir: string): string {
  return findWorkspaceRoot(startDir);
}
