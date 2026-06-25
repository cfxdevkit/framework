/**
 * PI customization extension for Conflux DevKit.
 *
 * Replaces the old @cfxdevkit/pi-agent TypeScript wrapper.
 * All PI integration is done through the ExtensionAPI —
 * no direct file reads, no scope resolution.
 */

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { registerPiCdkCommands } from './commands/cdk.js';
import { registerPiRepoCommands } from './commands/index.js';
import { createPiProviderBridge, registerPiProviderBridge } from './provider/bridge.js';
import { registerPiRepoTools } from './tools.js';
import { clearPiOperatorWidgets, clearPiWorkflowProgress, createPiRuntimeUiState } from './ui.js';

export { createPiProviderBridge } from './provider/bridge.js';
export type { PiProviderBridge } from './provider/types.js';
export {
  executeCdkContractsExtract,
  executeCdkDerive,
  executeCdkGenerate,
  executeCdkStatus,
} from './tools/cdk.js';
export { executePiCommitSession, setTuiConfirm } from './tools/commit.js';
export {
  clearPiWorkflowProgress,
  createPiGateUiState,
  createPiRuntimeUiState,
  type PiOperatorUiState,
  setPiWorkflowProgress,
} from './ui.js';

// ---------------------------------------------------------------------------
// PI Extension Entry Point
// ---------------------------------------------------------------------------

/**
 * Register all Conflux DevKit PI customizations with the PI runtime.
 * This is the single entry point for the pi-customization package.
 */
// biome-ignore lint/style/noDefaultExport: PI extension entry point requires default export
export default async function registerRepoPiExtension(pi: ExtensionAPI): Promise<void> {
  // Register provider — PI reads from ~/.pi/agent/providers.json
  const providerBridge = await createPiProviderBridge();
  registerPiProviderBridge(pi, providerBridge);

  // Register commands (cdk, repo-*)
  registerPiCdkCommands(pi);
  registerPiRepoCommands(pi);

  // Register tools (repo-agent-check, repo-run-action, etc.)
  registerPiRepoTools(pi);

  // Set up UI state on session events
  pi.on('session_start', async (_event, ctx) => {
    await refreshPiRuntimeUi(ctx);
  });

  pi.on('session_tree', async (_event, ctx) => {
    await refreshPiRuntimeUi(ctx);
  });

  pi.on('session_shutdown', async (_event, ctx) => {
    clearPiOperatorWidgets(ctx);
    clearPiWorkflowProgress(ctx);
  });
}

/**
 * Refresh the runtime UI state (context widget showing provider/model info).
 */
async function refreshPiRuntimeUi(ctx: ExtensionContext): Promise<void> {
  if (!ctx.hasUI) {
    return;
  }

  try {
    const providerBridge = await createPiProviderBridge();
    const state = createPiRuntimeUiState({
      extension: {
        name: 'cfxdevkit-repo-agent',
        resources: {
          settingsPath: '~/.pi/agent/settings.json',
          promptPath: '~/.pi/agent/prompts/repo-system.md',
          skillPath: '~/.pi/agent/skills/repo-actions.md',
          extensionPath: '~/.pi/agent/npm/@cfxdevkit/pi-customization/dist/index.js',
        },
      },
      providerBridge,
      actionCount: 4,
    });
    ctx.ui.setWidget('repo-agent-context', [...state.widgetLines], { placement: 'aboveEditor' });
  } catch {
    // Non-fatal — provider config may not be ready yet
  }
}
