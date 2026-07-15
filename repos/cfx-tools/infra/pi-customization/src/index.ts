/**
 * PI customization extension for Conflux DevKit.
 *
 * Replaces the old @cfxdevkit/pi-agent TypeScript wrapper.
 * All PI integration is done through the ExtensionAPI —
 * no direct file reads, no scope resolution.
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { registerPiCdkCommands } from './commands/cdk.js';
import { registerPiRepoCommands } from './commands/index.js';
import { createPiProviderBridge, registerPiProviderBridge } from './provider/bridge.js';
import { registerPiRepoTools } from './tools.js';
import { clearPiOperatorWidgets, clearPiWorkflowProgress } from './ui.js';

export { createPiProviderBridge } from './provider/bridge.js';
export type { PiProviderBridge } from './provider/types.js';
export {
  executeCdkContractsExtract,
  executeCdkDerive,
  executeCdkGenerate,
  executeCdkStatus,
} from './tools/cdk.js';
export { executePiCommitSession } from './tools/commit.js';
export {
  clearPiWorkflowProgress,
  createPiGateUiState,
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

  pi.on('session_shutdown', async (_event, ctx) => {
    clearPiOperatorWidgets(ctx);
    clearPiWorkflowProgress(ctx);
  });
}
