/**
 * /repo-status command — show repo agent scope, provider, and model context.
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { createPiAgentExtension, resolvePiScopeFromEnv } from '../extension.js';
import { getPiActionDefinitions } from '../llm-agents-runtime.js';
import { createPiProviderBridge } from '../providers.js';
import { createPiRuntimeUiState } from '../ui.js';
import { emitPiOperatorMessage } from './message.js';

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
