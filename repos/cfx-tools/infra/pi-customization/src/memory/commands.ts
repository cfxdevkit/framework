import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { runReflection } from './store.js';
import type { MemoryStore } from './store-core.js';

export function registerMemoryCommands(pi: ExtensionAPI, getStore: () => MemoryStore | null): void {
  // Register /memory command
  pi.registerCommand('memory', {
    description: 'Memory system management',
    handler: async (args: string, ctx) => {
      const store = getStore();
      if (!store) {
        ctx.ui.notify('Memory system not initialized.', 'error');
        return;
      }

      const subcommand = args?.trim().split(' ')[0];
      const rest = args
        ?.trim()
        .slice(subcommand?.length || 0)
        .trim();

      switch (subcommand) {
        case 'stats': {
          const stats = store.getStats();
          const inboxCount = (await store.getInbox()).length;
          ctx.ui.notify(
            `Core: ${stats.coreLearnings}, Corrections: ${stats.corrections}, Preferences: ${stats.preferences}, Patterns: ${stats.patterns}, Daily: ${stats.dailyLogEntries}, Inbox: ${inboxCount}`,
            'info',
          );
          break;
        }
        case 'search': {
          if (!rest) {
            ctx.ui.notify('Usage: /memory search <query>', 'info');
            return;
          }
          const results = await store.searchMemory(rest, 5);
          ctx.ui.notify(
            results.length > 0
              ? results.map((r, i) => `${i + 1}. [${r.kind}] ${r.content}`).join('\n')
              : 'No results',
            'info',
          );
          break;
        }
        case 'inbox': {
          const inbox = await store.getInbox();
          ctx.ui.notify(
            inbox.length > 0
              ? inbox.map((r) => `[${r.kind}] ${r.content}`).join('\n')
              : 'Inbox is empty',
            'info',
          );
          break;
        }
        case 'write':
          if (!rest) {
            ctx.ui.notify('Usage: /memory write <content>', 'info');
            return;
          }
          ctx.ui.notify('Use memory_write tool for explicit memory storage.', 'info');
          break;
        case 'reflect': {
          ctx.ui.notify('Running reflection...', 'info');
          const result = await runReflection(store, store.configValue, ctx.modelRegistry);
          ctx.ui.notify(result, 'info');
          await store.save();
          break;
        }
        default:
          ctx.ui.notify(
            'Memory management commands:\n- /memory stats\n- /memory search <query>\n- /memory inbox\n- /memory write <content>\n- /memory reflect',
            'info',
          );
      }
    },
  });

  // Register /memory-reflect command
  pi.registerCommand('memory-reflect', {
    description: 'Run reflection on recent sessions to update core learnings',
    handler: async (_args, ctx) => {
      const store = getStore();
      if (!store) {
        ctx.ui.notify('Memory system not initialized.', 'error');
        return;
      }

      ctx.ui.notify('Running reflection...', 'info');
      const result = await runReflection(store, store.configValue, ctx.modelRegistry);
      ctx.ui.notify(result, 'info');
      await store.save();
    },
  });
}
