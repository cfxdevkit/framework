import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { registerPiCdkCommands } from './commands/cdk.js';
import { registerPiRepoCommands } from './commands.js';
import { getPiActionDefinitions } from './llm-agents-runtime.js';
import { createPiProviderBridge, registerPiProviderBridge } from './providers.js';
import { registerPiRepoTools } from './tools.js';
import { clearPiOperatorWidgets, clearPiWorkflowProgress, createPiRuntimeUiState } from './ui.js';

export type PiScopeName = string;

export const piScopeEnvVar = 'CFXDEVKIT_PI_SCOPE';

export interface PiAgentExtension {
  readonly name: 'cfxdevkit-repo-agent';
  readonly scope?: PiScopeName;
  readonly resources: {
    readonly settingsPath: string;
    readonly promptPath: string;
    readonly skillPath: string;
    readonly extensionPath: string;
  };
}

export function createPiAgentExtension(scope?: PiScopeName): PiAgentExtension {
  return {
    name: 'cfxdevkit-repo-agent',
    scope,
    resources: {
      settingsPath: '.pi/settings.json',
      promptPath: '.pi/prompts/repo-system.md',
      skillPath: '.pi/skills/repo-actions.md',
      extensionPath: '.pi/extensions/repo-agent.ts',
    },
  };
}

export function resolvePiScopeFromEnv(): PiScopeName | undefined {
  const scope = process.env[piScopeEnvVar]?.trim();
  return scope ? scope : undefined;
}

export async function registerPiAgentProjectExtension(pi: ExtensionAPI): Promise<void> {
  registerPiProviderBridge(pi, await createPiProviderBridge(resolvePiScopeFromEnv()));
  registerPiRepoCommands(pi);
  registerPiCdkCommands(pi);
  registerPiRepoTools(pi);

  pi.on('session_start', async (_event, ctx) => {
    await refreshPiRuntimeUi(ctx);
  });

  pi.on('session_tree', async (_event, ctx) => {
    await refreshPiRuntimeUi(ctx);
  });

  pi.on('session_shutdown', async (_event, ctx) => {
    if (!ctx.hasUI) {
      return;
    }

    ctx.ui.setStatus('repo-agent', undefined);
    clearPiOperatorWidgets(ctx);
    clearPiWorkflowProgress(ctx);
  });
}

async function refreshPiRuntimeUi(ctx: ExtensionContext): Promise<void> {
  if (!ctx.hasUI) {
    return;
  }

  const scope = resolvePiScopeFromEnv();
  const providerBridge = await createPiProviderBridge(scope);
  const actionCount = (await getPiActionDefinitions()).length;
  const activeChanges = await readActiveOpenSpecChanges();
  const state = createPiRuntimeUiState({
    extension: createPiAgentExtension(scope),
    providerBridge,
    actionCount,
    activeChanges,
  });

  ctx.ui.setStatus('repo-agent', state.statusText);
}

const execFileAsync = promisify(execFile);

async function readActiveOpenSpecChanges(): Promise<readonly string[]> {
  try {
    const { stdout } = await execFileAsync('openspec', ['list', '--json'], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024,
    });
    const data = JSON.parse(stdout) as { changes: { name: string; status: string }[] };
    return data.changes.filter((c) => c.status !== 'archived').map((c) => c.name);
  } catch {
    return [];
  }
}
