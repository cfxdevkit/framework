import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { createPiAgentExtension, resolvePiScopeFromEnv } from './extension.js';
import { getPiActionDefinitions } from './llm-agents-runtime.js';
import { createPiProviderBridge } from './providers.js';
import { executePiCommitSession, executePiRepoAction } from './tools.js';
import {
  applyPiOperatorUiState,
  createPiCommitWorkflowUiState,
  clearPiWorkflowProgress,
  createPiRepoActionUiState,
  createPiRuntimeUiState,
  renderPiActionCatalogLines,
  setPiWorkflowProgress,
} from './ui.js';

export function registerPiRepoCommands(pi: ExtensionAPI): void {
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
      applyPiOperatorUiState(ctx, state);
      if (ctx.hasUI) {
        ctx.ui.notify('Updated repo agent context.', 'info');
      }
    },
  });

  pi.registerCommand('repo-actions', {
    description: 'List available shared repo workflows.',
    handler: async (args, ctx) => {
      const mode = normalizeModeArg(args);
      const entries = await getPiActionDefinitions();
      const lines = [...renderPiActionCatalogLines(entries, mode)];
      applyPiOperatorUiState(ctx, {
        statusText: `repo actions${mode ? ` · ${mode}` : ''}`,
        widgetKey: 'repo-agent-actions',
        widgetLines: lines,
      });
      if (ctx.hasUI) {
        ctx.ui.notify(`Listed ${Math.max(lines.length - 1, 0)} repo actions.`, 'info');
      }
    },
  });

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
        applyPiOperatorUiState(ctx, createPiRepoActionUiState(result));
        if (ctx.hasUI) {
          ctx.ui.notify(`Repo action completed: ${result.action}`, 'info');
        }
      } catch (error) {
        if (ctx.hasUI) {
          ctx.ui.notify(error instanceof Error ? error.message : String(error), 'error');
        }
      } finally {
        clearPiWorkflowProgress(ctx);
      }
    },
  });

  pi.registerCommand('repo-commit', {
    description: 'Run the non-exiting repository commit workflow: /repo-commit [--quick] [--model <id>] [prompt]',
    handler: async (args, ctx) => {
      const parsed = parseRepoRunArgs(args);

      setPiWorkflowProgress(ctx, 'Running interactive commit workflow');
      try {
        const result = await executePiCommitSession({
          ...(parsed.prompt ? { prompt: parsed.prompt } : {}),
          ...(parsed.quick ? { quick: true } : {}),
          ...(parsed.model ? { model: parsed.model } : {}),
        });
        applyPiOperatorUiState(ctx, createPiCommitWorkflowUiState(result));
        if (ctx.hasUI) {
          ctx.ui.notify(describeCommitResult(result), 'info');
        }
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

function parseRepoRunArgs(rawArgs: string): {
  action?: string;
  prompt?: string;
  quick?: boolean;
  model?: string;
} {
  const tokens = tokenizeArgs(rawArgs);
  const [action, ...rest] = tokens;
  const promptParts: string[] = [];
  let quick = false;
  let model: string | undefined;

  for (let index = 0; index < rest.length; index++) {
    const token = rest[index];
    if (token === '--quick') {
      quick = true;
      continue;
    }
    if (token === '--model') {
      model = rest[index + 1];
      index += 1;
      continue;
    }
    promptParts.push(token);
  }

  return {
    ...(action ? { action } : {}),
    ...(promptParts.length > 0 ? { prompt: promptParts.join(' ') } : {}),
    ...(quick ? { quick: true } : {}),
    ...(model ? { model } : {}),
  };
}

function normalizeModeArg(rawArgs: string): 'deterministic' | 'exploratory' | undefined {
  const [first] = tokenizeArgs(rawArgs);
  if (first === 'deterministic' || first === 'exploratory') {
    return first;
  }
  return undefined;
}

function tokenizeArgs(value: string): string[] {
  const matches = value.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
  return matches.map((token) => token.replace(/^['"]|['"]$/g, ''));
}

function describeCommitResult(result: Awaited<ReturnType<typeof executePiCommitSession>>): string {
  if (!result) {
    return 'Commit workflow found no changed scopes.';
  }
  if (result.status === 'blocked') {
    return `Commit workflow paused in ${result.phase}.`;
  }
  if (result.status === 'approval-required') {
    return 'Commit workflow is ready for approval.';
  }
  if (result.status === 'dry-run') {
    return 'Commit workflow completed in dry-run mode.';
  }
  if (result.status === 'aborted') {
    return 'Commit workflow was aborted before commit execution.';
  }
  return 'Commit workflow completed successfully.';
}
