/**
 * /repo-commit command — TUI-native repository commit workflow.
 *
 * Single-pass: runs the commit workflow with TUI-native approval via
 * setTuiConfirm. No two-pass approval dance needed — the workflow's
 * confirmPrompt uses ctx.ui.confirm() directly.
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type { PiCommitWorkflowResult } from '../llm-agents-runtime.js';
import { executePiCommitSession, setTuiConfirm } from '../tools.js';
import {
  clearPiWorkflowProgress,
  createPiCommitWorkflowUiState,
  setPiWorkflowProgress,
} from '../ui.js';
import { emitPiOperatorMessage } from './message.js';
import { parseRepoRunArgs } from './parser.js';

type CommitTone = 'info' | 'success' | 'warning' | 'error';

/**
 * Classify the result status into a display tone.
 */
function classifyCommitTone(result: PiCommitWorkflowResult | null): CommitTone {
  if (!result) {
    return 'info';
  }
  if (result.status === 'blocked' || result.status === 'aborted') {
    return 'warning';
  }
  if (result.status === 'approval-required' || result.status === 'dry-run') {
    return 'info';
  }
  return 'success';
}

export function registerRepoCommitCommand(pi: ExtensionAPI): void {
  pi.registerCommand('repo-commit', {
    description:
      'Run the non-exiting repository commit workflow: /repo-commit [--quick] [--model <id>] [prompt]',
    handler: async (args, ctx) => {
      const parsed = parseRepoRunArgs(args);

      setPiWorkflowProgress(ctx, 'Running interactive commit workflow');
      try {
        // Single-pass: run commit workflow with TUI-native approval.
        // The workflow's confirmPrompt uses setTuiConfirm callback which
        // delegates to ctx.ui.confirm() — no two-pass dance needed.
        setTuiConfirm(async (question) => {
          return await ctx.ui.confirm('Approve commit?', question, {
            timeout: 300000,
          });
        });

        const result = await executePiCommitSession({
          ...(parsed.prompt ? { prompt: parsed.prompt } : {}),
          ...(parsed.quick ? { quick: true } : {}),
          ...(parsed.model ? { model: parsed.model } : {}),
          tuiMode: true,
          singlePassApproval: true,
        });

        if (!result) {
          // Working tree clean or nothing to commit
          emitPiOperatorMessage(pi, ctx, createPiCommitWorkflowUiState(null), {
            tone: 'info',
          });
          return;
        }

        emitPiOperatorMessage(pi, ctx, createPiCommitWorkflowUiState(result), {
          tone: classifyCommitTone(result),
        });
      } catch (error) {
        if (ctx.hasUI) {
          ctx.ui.notify(error instanceof Error ? error.message : String(error), 'error');
        }
      } finally {
        setTuiConfirm(null);
        clearPiWorkflowProgress(ctx);
      }
    },
  });
}
