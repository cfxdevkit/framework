import type { ExtensionAPI, ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import { Box, Text } from '@earendil-works/pi-tui';
import { createPiAgentExtension, resolvePiScopeFromEnv } from './extension.js';
import { executePiAgentCheck, getPiActionDefinitions } from './llm-agents-runtime.js';
import { createPiProviderBridge } from './providers.js';
import { executePiCommitSession, executePiRepoAction } from './tools.js';
import {
  clearPiOperatorWidgets,
  clearPiWorkflowProgress,
  createPiAgentCheckUiState,
  createPiCommitWorkflowUiState,
  createPiRepoActionUiState,
  createPiRuntimeUiState,
  type PiOperatorUiState,
  renderPiActionCatalogLines,
  setPiWorkflowProgress,
} from './ui.js';

const piOperatorMessageType = 'repo-agent-summary';

type PiOperatorMessageTone = 'info' | 'success' | 'warning' | 'error';

type PiOperatorMessageDetails = {
  readonly title: string;
  readonly lines: readonly string[];
  readonly tone: PiOperatorMessageTone;
};

export function registerPiRepoCommands(pi: ExtensionAPI): void {
  registerPiOperatorMessageRenderer(pi);

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

  pi.registerCommand('repo-commit', {
    description:
      'Run the non-exiting repository commit workflow: /repo-commit [--quick] [--model <id>] [prompt]',
    handler: async (args, ctx) => {
      const parsed = parseRepoRunArgs(args);

      setPiWorkflowProgress(ctx, 'Running interactive commit workflow');
      try {
        const result = await executePiCommitSession({
          ...(parsed.prompt ? { prompt: parsed.prompt } : {}),
          ...(parsed.quick ? { quick: true } : {}),
          ...(parsed.model ? { model: parsed.model } : {}),
        });
        emitPiOperatorMessage(pi, ctx, createPiCommitWorkflowUiState(result), {
          tone: classifyCommitTone(result),
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

function registerPiOperatorMessageRenderer(pi: ExtensionAPI): void {
  pi.registerMessageRenderer<PiOperatorMessageDetails>(
    piOperatorMessageType,
    (message, { expanded }, theme) => {
      const details = message.details;
      if (!isPiOperatorMessageDetails(details)) {
        return undefined;
      }

      const title = theme.fg(toThemeColor(details.tone), details.title);
      const visibleLines = expanded ? [...details.lines] : details.lines.slice(0, 4);
      const lines = [title, ...visibleLines];
      if (!expanded && details.lines.length > visibleLines.length) {
        lines.push(theme.fg('dim', `... ${details.lines.length - visibleLines.length} more lines`));
      }

      const box = new Box(1, 0, (text) => theme.bg('customMessageBg', text));
      box.addChild(new Text(lines.join('\n'), 0, 0));
      return box;
    },
  );
}

function emitPiOperatorMessage(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  state: PiOperatorUiState,
  options: { readonly tone?: PiOperatorMessageTone } = {},
): void {
  if (ctx.hasUI) {
    clearPiOperatorWidgets(ctx);
  }

  const [title = state.statusText, ...lines] = state.widgetLines;
  pi.sendMessage({
    customType: piOperatorMessageType,
    content: title,
    display: true,
    details: {
      title,
      lines,
      tone: options.tone ?? 'info',
    },
  });
}

function isPiOperatorMessageDetails(value: unknown): value is PiOperatorMessageDetails {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as { title?: unknown; lines?: unknown; tone?: unknown };
  return (
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.lines) &&
    candidate.lines.every((line) => typeof line === 'string') &&
    (candidate.tone === 'info' ||
      candidate.tone === 'success' ||
      candidate.tone === 'warning' ||
      candidate.tone === 'error')
  );
}

function toThemeColor(tone: PiOperatorMessageTone): 'accent' | 'success' | 'warning' | 'error' {
  switch (tone) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'accent';
  }
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

function classifyCommitTone(
  result: Awaited<ReturnType<typeof executePiCommitSession>>,
): PiOperatorMessageTone {
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

function parseRepoCheckArgs(rawArgs: string): {
  dryRun: boolean;
  createBranch: boolean;
  quick: boolean;
} {
  const tokens = tokenizeArgs(rawArgs);
  return {
    dryRun: tokens.includes('--dry-run'),
    createBranch: tokens.includes('--create-branch'),
    quick: tokens.includes('--quick'),
  };
}
