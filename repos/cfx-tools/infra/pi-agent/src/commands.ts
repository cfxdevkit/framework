/**
 * Main entry point for repo commands.
 * All command registrations are delegated to sub-modules.
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import {
  emitPiOperatorMessage,
  registerPiOperatorMessageRenderer,
  registerRepoActionsCommand,
  registerRepoCheckCommand,
  registerRepoCommitCommand,
  registerRepoRunCommand,
  registerRepoStatusCommand,
} from './commands/index.js';

export type { PiOperatorUiState } from './ui.js';
export { emitPiOperatorMessage, registerPiOperatorMessageRenderer };

/**
 * Register all repo commands. Delegates to sub-modules.
 */
export function registerPiRepoCommands(pi: ExtensionAPI): void {
  registerPiOperatorMessageRenderer(pi);
  registerRepoStatusCommand(pi);
  registerRepoActionsCommand(pi);
  registerRepoRunCommand(pi);
  registerRepoCheckCommand(pi);
  registerRepoCommitCommand(pi);
}
