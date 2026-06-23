/**
 * Shared repo workflows — /repo-actions, /repo-check, /repo-commit,
 * /repo-run, /repo-status commands consolidated into a single module.
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { createPiAgentExtension, resolvePiScopeFromEnv } from '../extension.js';
import type { PiCommitWorkflowResult } from '../llm-agents-runtime.js';
import { executePiAgentCheck, getPiActionDefinitions } from '../llm-agents-runtime.js';
import { createPiProviderBridge } from '../providers.js';
import { executePiCommitSession, executePiRepoAction, setTuiConfirm } from '../tools.js';
import {
  clearPiWorkflowProgress,
  createPiAgentCheckUiState,
  createPiCommitWorkflowUiState,
  createPiRepoActionUiState,
  createPiRuntimeUiState,
  renderPiActionCatalogLines,
  setPiWorkflowProgress,
} from '../ui.js';
import { emitPiOperatorMessage } from './message.js';
import { normalizeModeArg, parseRepoCheckArgs, parseRepoRunArgs } from './parser.js';

// ---------------------------------------------------------------------------
// /repo-actions — list available shared repo workflows
// ---------------------------------------------------------------------------

export function registerRepoActionsCommand(pi: ExtensionAPI): void {
  pi.registerCommand('repo-actions', {
    description: 'List available shared repo workflows.',
    handler: async (args, ctx) => {
      const mode = normalizeModeArg(args);
      const entries = await getPiActionDefinitions();
      emitPiOperatorMessage(pi, ctx, {
        statusText: `repo actions${mode ? ` · ${mode}` : ''}`,
        widgetKey: 'repo-agent-actions',
        widgetLines: [...renderPiActionCatalogLines(entries, mode)],
      });
    },
  });
}

// ---------------------------------------------------------------------------
// /repo-check — run repo validation → OpenSpec change planning
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// /repo-commit — TUI-native repository commit workflow
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// /repo-run — run a shared repo action
// ---------------------------------------------------------------------------

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
        emitPiOperatorMessage(pi, ctx, createPiRepoActionUiState(result), {
          tone: 'success',
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

// ---------------------------------------------------------------------------
// /repo-status — show repo agent scope, provider, model context
// ---------------------------------------------------------------------------

export function registerRepoStatusCommand(pi: ExtensionAPI): void {
  pi.registerCommand('repo-status', {
    description: 'Show the current repo agent scope, provider, and model context.',
    handler: async (_args, ctx) => {
      const providerBridge = await createPiProviderBridge(resolvePiScopeFromEnv());
      const entries = await getPiActionDefinitions();
      const state = createPiRuntimeUiState({
        extension: createPiAgentExtension(resolvePiScopeFromEnv()),
        providerBridge,
        actionCount: entries.length,
      });
      if (ctx.hasUI) {
        ctx.ui.setStatus('repo-agent', state.statusText);
      }
      emitPiOperatorMessage(pi, ctx, state, { tone: 'info' });
    },
  });
}
