/**
 * Message rendering helpers for repo commands.
 * Extracted from commands.ts to reduce file size.
 */

import type { ExtensionAPI, ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import { Box, Text } from '@earendil-works/pi-tui';
import type { PiOperatorUiState } from '../ui.js';
import { clearPiOperatorWidgets } from '../ui.js';

const piOperatorMessageType = 'repo-agent-summary';

type PiOperatorMessageTone = 'info' | 'success' | 'warning' | 'error';

type PiOperatorMessageDetails = {
  readonly title: string;
  readonly lines: readonly string[];
  readonly tone: PiOperatorMessageTone;
};

export function registerPiOperatorMessageRenderer(pi: ExtensionAPI): void {
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

export function emitPiOperatorMessage(
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
