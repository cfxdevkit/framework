/**
 * /repo-run command — run a shared repo action.
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { executePiRepoAction } from '../tools.js';
import {
  clearPiWorkflowProgress,
  createPiRepoActionUiState,
  setPiWorkflowProgress,
} from '../ui.js';
import { emitPiOperatorMessage } from './message.js';
import { parseRepoRunArgs } from './parser.js';

export function registerRepoRunCommand(pi: ExtensionAPI): void {
  pi.registerCommand('repo-run', {
    description: 'Run a shared repo action: /repo-run <action> [--quick] [--model <id>] [prompt]',
    handler: async (args, ctx) => {
      const parsed = parseRepoRunArgs(args);
      if (!parsed.action) {
        if (ctx.hasUI) {
          ctx.ui.notify('Usage: /repo-run <action> [--quick] [--model <id>] [prompt]', 'error');
        }
        return;
      }

      setPiWorkflowProgress(ctx, `Running repo action: ${parsed.action}`);
      try {
        const result = await executePiRepoAction({
          action: parsed.action,
          ...(parsed.prompt ? { prompt: parsed.prompt } : {}),
          ...(parsed.quick ? { quick: true } : {}),
          ...(parsed.model ? { model: parsed.model } : {}),
        });
        emitPiOperatorMessage(pi, ctx, createPiRepoActionUiState(result), { tone: 'success' });
      } catch (error) {
        if (ctx.hasUI) {
          ctx.ui.notify(error instanceof Error ? error.message : String(error), 'error');
        }
      } finally {
        clearPiWorkflowProgress(ctx);
      }
    },
  });
}
