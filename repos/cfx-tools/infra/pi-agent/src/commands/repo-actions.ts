/**
 * /repo-actions command — list available shared repo workflows.
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { getPiActionDefinitions } from '../llm-agents-runtime.js';
import { renderPiActionCatalogLines } from '../ui.js';
import { emitPiOperatorMessage } from './message.js';
import { normalizeModeArg } from './parser.js';

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
