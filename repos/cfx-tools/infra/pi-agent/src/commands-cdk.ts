/**
 * CDK slash commands for pi chat.
 *
 * Maps /cdk <subcommand> to the same surface as the `cfx` CLI.
 * These handlers are PURELY DETERMINISTIC — no LLM, no agent, no recursion.
 * They call tools-cdk.ts which calls @cfxdevkit/cli pure functions.
 *
 * Subcommands:
 *   /cdk status [--chain <id|name>] [--rpc <url>]
 *   /cdk derive --mnemonic "<phrase>" | --generate [--count N] [--start I]
 *              [--type standard|mining] [--core-network-id <id>]
 *              [--passphrase "<p>"] [--show-private-keys] [--show-mnemonic]
 *              [--strength 128|256]
 *   /cdk generate [--strength 128|256]
 *   /cdk contracts extract [--artifacts <dir>] [--out <dir>]
 */
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Box, Text } from '@earendil-works/pi-tui';
import { parseArgs } from '@cfxdevkit/cli';
import {
  executeCdkContractsExtract,
  executeCdkDerive,
  executeCdkGenerate,
  executeCdkStatus,
  type RunContractsExtractOptions,
  type RunDeriveOptions,
  type RunGenerateOptions,
  type RunStatusOptions,
} from './tools-cdk.js';
import { clearPiOperatorWidgets, type PiOperatorUiState } from './ui.js';
import {
  createCdkContractsUiState,
  createCdkDeriveUiState,
  createCdkGenerateUiState,
  createCdkStatusUiState,
} from './ui-cdk.js';
import { bool, num, str, tokenize } from './commands-cdk-flags.js';

const CDK_HELP = `cfx — Conflux developer CLI (chat surface)

Subcommands:
  /cdk status [--chain <id|name>] [--rpc <url>]
  /cdk derive --mnemonic "<phrase>" | --generate
    [--count N] [--start I] [--type standard|mining]
    [--core-network-id <id>] [--passphrase "<p>"]
    [--show-private-keys] [--show-mnemonic] [--strength 128|256]
  /cdk generate [--strength 128|256]
  /cdk contracts extract [--artifacts <dir>] [--out <dir>]`;

const cdkMessageType = 'cdk-result';

type CdkMessageTone = 'info' | 'success' | 'warning' | 'error';

type CdkMessageDetails = {
  readonly title: string;
  readonly lines: readonly string[];
  readonly tone: CdkMessageTone;
};

function isCdkMessageDetails(value: unknown): value is CdkMessageDetails {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c['title'] === 'string' &&
    Array.isArray(c['lines']) &&
    (c['lines'] as unknown[]).every((l) => typeof l === 'string') &&
    (c['tone'] === 'info' ||
      c['tone'] === 'success' ||
      c['tone'] === 'warning' ||
      c['tone'] === 'error')
  );
}

export function registerPiCdkCommands(pi: ExtensionAPI): void {
  registerCdkMessageRenderer(pi);

  pi.registerCommand('cdk', {
    description: `Conflux developer CLI in chat: /cdk <status|derive|generate|contracts> [options]`,
    handler: async (rawArgs, ctx) => {
      const tokens = tokenize(rawArgs);
      const [subcommand, ...rest] = tokens;

      if (!subcommand || subcommand === 'help') {
        emitCdkMessage(pi, ctx, {
          statusText: 'cdk help',
          widgetKey: 'cdk-help',
          widgetLines: CDK_HELP.split('\n'),
        });
        return;
      }

      try {
        switch (subcommand) {
          case 'status':
            await handleCdkStatus(pi, ctx, rest);
            break;
          case 'derive':
            handleCdkDerive(pi, ctx, rest);
            break;
          case 'generate':
            handleCdkGenerate(pi, ctx, rest);
            break;
          case 'contracts':
            await handleCdkContracts(pi, ctx, rest);
            break;
          default:
            if (ctx.hasUI) {
              ctx.ui.notify(`Unknown cdk subcommand: ${subcommand}. Try /cdk help`, 'error');
            }
        }
      } catch (error) {
        if (ctx.hasUI) {
          ctx.ui.notify(
            `cdk ${subcommand}: ${error instanceof Error ? error.message : String(error)}`,
            'error',
          );
        }
      }
    },
  });
}

// ─── Sub-handlers ─────────────────────────────────────────────────────────────

async function handleCdkStatus(
  pi: ExtensionAPI,
  ctx: Parameters<typeof emitCdkMessage>[1],
  args: string[],
): Promise<void> {
  const flags = parseArgs(['status', ...args]).flags;
  const opts: RunStatusOptions = {};
  const chain = str(flags, 'chain');
  if (chain) opts.chain = chain;
  const rpc = str(flags, 'rpc');
  if (rpc) opts.rpc = rpc;

  const reports = await executeCdkStatus(opts);
  const uiState = createCdkStatusUiState(reports);
  const tone: CdkMessageTone = reports.every((r) => r.ok)
    ? 'success'
    : reports.some((r) => r.ok)
      ? 'warning'
      : 'error';
  emitCdkMessage(pi, ctx, uiState, tone);
}

function handleCdkDerive(
  pi: ExtensionAPI,
  ctx: Parameters<typeof emitCdkMessage>[1],
  args: string[],
): void {
  const parsed = parseArgs(['derive', ...args]);
  const flags = parsed.flags;
  const opts: RunDeriveOptions = {};

  const mnemonic = str(flags, 'mnemonic');
  if (mnemonic) opts.mnemonic = mnemonic;
  if (bool(flags, 'generate')) opts.generate = true;
  const count = num(flags, 'count');
  if (count !== undefined) opts.count = count;
  const start = num(flags, 'start');
  if (start !== undefined) opts.startIndex = start;
  const type = str(flags, 'type');
  if (type === 'standard' || type === 'mining') opts.accountType = type;
  const coreId = num(flags, 'core-network-id');
  if (coreId !== undefined) opts.coreNetworkId = coreId as 1 | 1029 | 2029;
  const passphrase = str(flags, 'passphrase');
  if (passphrase) opts.passphrase = passphrase;
  const strength = num(flags, 'strength');
  if (
    strength === 128 ||
    strength === 160 ||
    strength === 192 ||
    strength === 224 ||
    strength === 256
  ) {
    opts.strength = strength;
  }

  const report = executeCdkDerive(opts);
  const uiState = createCdkDeriveUiState(report, {
    showPrivateKeys: bool(flags, 'show-private-keys'),
    showMnemonic: opts.generate || bool(flags, 'show-mnemonic'),
  });
  emitCdkMessage(pi, ctx, uiState, 'success');
}

function handleCdkGenerate(
  pi: ExtensionAPI,
  ctx: Parameters<typeof emitCdkMessage>[1],
  args: string[],
): void {
  const flags = parseArgs(['generate', ...args]).flags;
  const opts: RunGenerateOptions = {};
  const strength = num(flags, 'strength');
  if (
    strength === 128 ||
    strength === 160 ||
    strength === 192 ||
    strength === 224 ||
    strength === 256
  ) {
    opts.strength = strength;
  }

  const report = executeCdkGenerate(opts);
  const uiState = createCdkGenerateUiState(report);
  emitCdkMessage(pi, ctx, uiState, 'success');
}

async function handleCdkContracts(
  pi: ExtensionAPI,
  ctx: Parameters<typeof emitCdkMessage>[1],
  args: string[],
): Promise<void> {
  const [action, ...rest] = args;
  if (action !== 'extract') {
    if (ctx.hasUI) {
      ctx.ui.notify(
        `Unknown cdk contracts action: ${action ?? '(none)'}. Try /cdk contracts extract`,
        'error',
      );
    }
    return;
  }

  const flags = parseArgs(['contracts', 'extract', ...rest]).flags;
  const opts: RunContractsExtractOptions = {};
  const artifacts = str(flags, 'artifacts') ?? str(flags, 'a');
  if (artifacts) opts.artifacts = artifacts;
  const out = str(flags, 'out') ?? str(flags, 'o');
  if (out) opts.out = out;

  const report = await executeCdkContractsExtract(opts);
  const uiState = createCdkContractsUiState(report);
  emitCdkMessage(pi, ctx, uiState, 'success');
}

// ─── Renderer + emit ──────────────────────────────────────────────────────────

function registerCdkMessageRenderer(pi: ExtensionAPI): void {
  pi.registerMessageRenderer<CdkMessageDetails>(cdkMessageType, (message, { expanded }, theme) => {
    const details = message.details;
    if (!isCdkMessageDetails(details)) return undefined;

    const titleColor =
      details.tone === 'success'
        ? 'success'
        : details.tone === 'warning'
          ? 'warning'
          : details.tone === 'error'
            ? 'error'
            : 'accent';

    const title = theme.fg(titleColor, details.title);
    const visible = expanded ? [...details.lines] : details.lines.slice(0, 5);
    const extra =
      !expanded && details.lines.length > visible.length
        ? [theme.fg('dim', `... ${details.lines.length - visible.length} more lines`)]
        : [];

    const box = new Box(1, 0, (t) => theme.bg('customMessageBg', t));
    box.addChild(new Text([title, ...visible, ...extra].join('\n'), 0, 0));
    return box;
  });
}

function emitCdkMessage(
  pi: ExtensionAPI,
  ctx: {
    hasUI: boolean;
    ui: {
      setStatus: (k: string, v: string | undefined) => void;
      setWidget: (k: string, v: unknown, opts: unknown) => void;
      notify: (msg: string, level: string) => void;
    };
  },
  state: PiOperatorUiState,
  tone: CdkMessageTone = 'info',
): void {
  if (ctx.hasUI) {
    clearPiOperatorWidgets(ctx as never);
    ctx.ui.setStatus('cdk', state.statusText);
  }

  const [title = state.statusText, ...lines] = state.widgetLines;
  pi.sendMessage({
    customType: cdkMessageType,
    content: title,
    display: true,
    details: { title, lines, tone } satisfies CdkMessageDetails,
  });
}
