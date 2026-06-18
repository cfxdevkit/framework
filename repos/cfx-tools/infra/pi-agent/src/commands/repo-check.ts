/**
 * /repo-check command — run repo validation → OpenSpec change planning.
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { executePiAgentCheck } from '../llm-agents-runtime.js';
import {
  clearPiWorkflowProgress,
  createPiAgentCheckUiState,
  setPiWorkflowProgress,
} from '../ui.js';
import { emitPiOperatorMessage } from './message.js';
import { parseRepoCheckArgs } from './parser.js';

export function registerRepoCheckCommand(pi: ExtensionAPI): void {
  pi.registerCommand('repo-check', {
    description:
      'Run the full repo validation → OpenSpec change planning pipeline: /repo-check [--dry-run] [--create-branch] [--quick]',
    handler: async (args, ctx) => {
      const parsed = parseRepoCheckArgs(args);
      setPiWorkflowProgress(ctx, 'Running agent check pipeline');
      try {
        const result = await executePiAgentCheck({
          dryRun: parsed.dryRun,
          createBranch: parsed.createBranch,
          quick: parsed.quick,
        });
        const tone =
          result.status === 'ok'
            ? 'success'
            : result.status === 'warning-planned'
              ? 'warning'
              : 'info';
        emitPiOperatorMessage(pi, ctx, createPiAgentCheckUiState(result), { tone });
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
