/**
 * /repo-commit command — TUI-native repository commit workflow.
 *
 * This command runs the commit workflow with deferred approval to avoid
 * breaking the TUI. After the first pass, if approval is required, it
 * uses the TUI's native confirm dialog instead of terminal UI.
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type { PiCommitWorkflowResult } from '../llm-agents-runtime.js';
import { executePiCommitSession } from '../tools.js';
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
        // First pass: run commit workflow (deferred approval to avoid breaking TUI)
        const initialResult = await executePiCommitSession({
          ...(parsed.prompt ? { prompt: parsed.prompt } : {}),
          ...(parsed.quick ? { quick: true } : {}),
          ...(parsed.model ? { model: parsed.model } : {}),
          tuiMode: true,
        });

        if (!initialResult) {
          // Working tree clean or nothing to commit
          emitPiOperatorMessage(pi, ctx, createPiCommitWorkflowUiState(null), {
            tone: 'info',
          });
          return;
        }

        // Handle approval in TUI if approval is required
        if (initialResult.status === 'approval-required') {
          if (!ctx.hasUI) {
            // Non-TUI mode: just display the approval-required status
            emitPiOperatorMessage(pi, ctx, createPiCommitWorkflowUiState(initialResult), {
              tone: 'warning',
            });
            return;
          }

          // TUI mode: show commit preview and ask for approval
          const commitPreview = initialResult.commitPreview;
          if (commitPreview) {
            // Display the commit preview to the user
            const approvalWidgetLines = [
              `Commit: ${commitPreview.subject}`,
              ...(commitPreview.body ? commitPreview.body.split('\n') : []),
              '',
              'Approval required: use the confirm dialog below to approve or decline.',
            ];

            emitPiOperatorMessage(
              pi,
              ctx,
              {
                statusText: 'Commit approval required',
                widgetKey: 'repo-commit-approval',
                widgetLines: approvalWidgetLines,
              },
              {
                tone: 'warning',
              },
            );

            // Use TUI's native confirm dialog for approval
            const confirmed = await ctx.ui.confirm(
              'Approve commit?',
              commitPreview.subject,
              commitPreview.body ? { timeout: 300000 } : undefined,
            );

            if (!confirmed) {
              // User declined: abort the commit
              emitPiOperatorMessage(
                pi,
                ctx,
                {
                  ...createPiCommitWorkflowUiState({
                    ...initialResult,
                    status: 'aborted',
                    approval: { required: true, approved: false, declined: true },
                  }),
                },
                {
                  tone: 'warning',
                },
              );
              return;
            }
          }

          // User approved: re-run with --yes flag to skip approval
          setPiWorkflowProgress(ctx, 'Commit approved — executing commit');
          const approvedResult = await executePiCommitSession({
            ...(parsed.prompt ? { prompt: parsed.prompt } : {}),
            ...(parsed.quick ? { quick: true } : {}),
            ...(parsed.model ? { model: parsed.model } : {}),
            tuiMode: true,
            yes: true,
          });

          if (approvedResult) {
            emitPiOperatorMessage(pi, ctx, createPiCommitWorkflowUiState(approvedResult), {
              tone: approvedResult.status === 'committed' ? 'success' : 'warning',
            });
          }
          return;
        }

        // No approval required: just display the result
        emitPiOperatorMessage(pi, ctx, createPiCommitWorkflowUiState(initialResult), {
          tone: classifyCommitTone(initialResult),
        });
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
