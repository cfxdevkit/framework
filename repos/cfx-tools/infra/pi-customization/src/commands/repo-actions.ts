/**
 * Shared repo workflows — /repo-actions, /repo-check, /repo-commit,
 * /repo-run, /repo-status commands consolidated into a single module.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import type { PiCommitWorkflowResult } from '../llm-agents-runtime.js';
import { executePiAgentCheck, getPiActionDefinitions } from '../llm-agents-runtime.js';
import { createPiProviderBridge } from '../provider/bridge.js';
import { executePiCommitSession, executePiRepoAction } from '../tools.js';
import {
  clearPiWorkflowProgress,
  createPiAgentCheckUiState,
  createPiCommitWorkflowUiState,
  createPiRepoActionUiState,
  createPiRuntimeUiState,
  renderPiActionCatalogLines,
  setPiWorkflowProgress,
} from '../ui.js';
import { emitPiOperatorMessage, registerPiOperatorMessageRenderer } from './message.js';
import { normalizeModeArg, parseRepoCheckArgs, parseRepoRunArgs } from './parser.js';

const execFileAsync = promisify(execFile);

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

      // Set up TUI confirm callback (scoped to this command call only).
      const tuiConfirm = async (question: string) => {
        return await ctx.ui.confirm('Approve commit?', question, {
          timeout: 300000,
        });
      };

      try {
        const result = await executePiCommitSession({
          ...(parsed.prompt ? { prompt: parsed.prompt } : {}),
          ...(parsed.quick ? { quick: true } : {}),
          ...(parsed.model ? { model: parsed.model } : {}),
          tuiMode: true,
          singlePassApproval: true,
          tuiConfirm,
          ...(ctx.hasUI ? { ctx: { hasUI: true, ui: ctx.ui } } : {}),
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
        // No-op: tuiConfirm is scoped to this call, no global cleanup needed.
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
// /repo-status — show repo provider, model context
// ---------------------------------------------------------------------------

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

export function registerRepoStatusCommand(pi: ExtensionAPI): void {
  pi.registerCommand('repo-status', {
    description: 'Show the current repo provider, model context, and available workflows.',
    handler: async (_args, ctx) => {
      const providerBridge = await createPiProviderBridge();
      const entries = await getPiActionDefinitions();
      const activeChanges = await readActiveOpenSpecChanges();
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
        actionCount: entries.length,
        activeChanges,
      });
      if (ctx.hasUI) {
        ctx.ui.setStatus('repo-agent', state.statusText);
      }
      emitPiOperatorMessage(pi, ctx, state, { tone: 'info' });
    },
  });
}

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
