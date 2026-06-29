import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { MemoryStore } from './store.js';
import { setModelRegistry } from './store.js';
import type { MemoryKind } from './types.js';

export function registerMemoryTools(pi: ExtensionAPI, getStore: () => MemoryStore | null): void {
  // Register memory_search tool
  pi.registerTool({
    name: 'memory_search',
    label: 'Search Memory',
    description: 'Search persistent memory for lessons, corrections, preferences, and patterns.',
    promptSnippet: 'Search persistent memory for lessons and corrections',
    parameters: Type.Object({
      query: Type.String({ description: 'Search query (keywords)' }),
      limit: Type.Optional(
        Type.Number({
          description: 'Maximum results to return (default: 5)',
          minimum: 1,
          maximum: 20,
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      if (_ctx?.modelRegistry) setModelRegistry(_ctx.modelRegistry);
      const store = getStore();
      if (!store) {
        return {
          content: [{ type: 'text', text: 'Memory system not initialized.' }],
          details: {},
        };
      }

      const results = await store.searchMemory(params.query, params.limit || 5);

      if (results.length === 0) {
        return {
          content: [{ type: 'text', text: `No memories found for "${params.query}".` }],
          details: {},
        };
      }

      const formatted = results
        .map(
          (r, i) =>
            `${i + 1}. [${r.kind}] (${r.confidence.toFixed(2)}) ${r.content}${r.tags.length > 0 ? ` Tags: ${r.tags.join(', ')}` : ''}`,
        )
        .join('\n\n');

      return {
        content: [{ type: 'text', text: formatted }],
        details: { count: results.length },
      };
    },
  });

  // Register memory_stats tool
  pi.registerTool({
    name: 'memory_stats',
    label: 'Memory Stats',
    description: 'Show memory system statistics (counts by type, daily logs, etc.)',
    promptSnippet: 'Show memory statistics',
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
      const store = getStore();
      if (!store) {
        return {
          content: [{ type: 'text', text: 'Memory system not initialized.' }],
          details: {},
        };
      }

      const stats = store.getStats();
      const inboxCount = (await store.getInbox()).length;

      const formatted = `Memory System Statistics:
- Core learnings: ${stats.coreLearnings}
- Corrections: ${stats.corrections}
- Preferences: ${stats.preferences}
- Patterns: ${stats.patterns}
- Daily log entries: ${stats.dailyLogEntries}
- Inbox items: ${inboxCount}`;

      return {
        content: [{ type: 'text', text: formatted }],
        details: { ...stats, inboxCount },
      };
    },
  });

  // Register memory_write tool
  pi.registerTool({
    name: 'memory_write',
    label: 'Write Memory',
    description:
      'Explicitly store a memory (correction, preference, lesson, pattern, or convention).',
    promptSnippet: 'Store a memory explicitly',
    parameters: Type.Object({
      kind: Type.Optional(
        Type.String({
          description: 'Memory type: correction, preference, lesson, pattern, convention',
          default: 'lesson',
        }),
      ),
      content: Type.String({ description: 'The memory content (concise, specific)' }),
      confidence: Type.Optional(
        Type.Number({
          description: 'Confidence score (0.0-1.0)',
          minimum: 0,
          maximum: 1,
          default: 0.9,
        }),
      ),
      tags: Type.Optional(
        Type.Array(Type.String(), {
          description: 'Tags for categorization',
          default: [],
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const store = getStore();
      if (!store) {
        return {
          content: [{ type: 'text', text: 'Memory system not initialized.' }],
          details: {},
        };
      }

      const kind = (params.kind || 'lesson') as MemoryKind;
      const memory = await store.addMemory({
        kind,
        content: params.content,
        confidence: params.confidence || 0.9,
        source: 'explicit',
        tags: params.tags || [],
        stability: 'semi_stable',
      });

      await store.save();

      return {
        content: [
          {
            type: 'text',
            text: `Memory stored: [${kind}] ${params.content} (id: ${memory.id})`,
          },
        ],
        details: { id: memory.id },
      };
    },
  });
}
