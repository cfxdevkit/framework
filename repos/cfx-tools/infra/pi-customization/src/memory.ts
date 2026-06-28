// @ts-nocheck
/**
 * Pi Persistent Memory — Minimal implementation
 *
 * Provides cross-session learning through:
 * - JSONL-based memory storage (canonical, git-friendly)
 * - Session-end LLM extraction of lessons, corrections, preferences
 * - One-shot memory injection at session start (via sendMessage)
 * - Memory search tool for the LLM
 * - Daily logs and core learnings
 *
 * Based on research into pi-memory, pi-persistent-intelligence, pi-reflect,
 * and pi-self-learning extensions.
 */

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { complete } from '@earendil-works/pi-ai/compat';
import type { ExtensionAPI, ModelRegistry } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';

// ============================================================================
// Types
// ============================================================================

type MemoryKind = 'correction' | 'preference' | 'lesson' | 'convention' | 'pattern';
type MemorySource = 'session' | 'correction' | 'explicit' | 'inference';
type MemoryStability = 'volatile' | 'semi_stable' | 'stable';

interface MemoryRecord {
  id: string;
  kind: MemoryKind;
  content: string;
  confidence: number;
  source: MemorySource;
  tags: string[];
  project?: string;
  created: number;
  updated: number;
  stability: MemoryStability;
}

interface DailyLogEntry {
  timestamp: number;
  content: string;
  messageCount: number;
}

interface MemoryConfig {
  enabled: boolean;
  minConfidence: number;
  maxCoreItems: number;
  maxDailyItems: number;
  injectionMaxChars: number;
  extractionModel: string;
  autoApplyHighConfidence: boolean;
  projectLocal: boolean;
}

interface MemoryState {
  coreLearnings: MemoryRecord[];
  corrections: MemoryRecord[];
  preferences: MemoryRecord[];
  patterns: MemoryRecord[];
  dailyLog: DailyLogEntry[];
  currentSessionMessages: any[];
  currentSessionId: string;
  projectRoot?: string;
  reflectionCount: number;
  lastReflectionDate: number;
}

// ============================================================================
// Constants & Defaults
// ============================================================================

const DEFAULT_CONFIG: MemoryConfig = {
  enabled: true,
  minConfidence: 0.8,
  maxCoreItems: 10,
  maxDailyItems: 50,
  injectionMaxChars: 8000,
  extractionModel: 'Qwen3.6-35B-A3B-MTP-GGUF-Q8_0',
  autoApplyHighConfidence: true,
  projectLocal: true,
  reflectionCadence: 'weekly', // daily, weekly, manual
  reflectionLookbackDays: 7,
};

const MEMORY_STORE_DIR = join(homedir(), '.pi', 'agent', 'memory');
const CORE_FILE = 'core.jsonl';
const CORRECTIONS_FILE = 'corrections.jsonl';
const PREFERENCES_FILE = 'preferences.jsonl';
const PATTERNS_FILE = 'patterns.jsonl';
const _DAILY_DIR = 'daily';
const INDEX_FILE = 'index.json';
const INBOX_FILE = 'inbox.jsonl';

// ============================================================================
// MemoryStore Class
// ============================================================================

class MemoryStore {
  private config: MemoryConfig;
  private state: MemoryState;
  private storePath: string;
  private indexPath: string;

  constructor(config: MemoryConfig, projectRoot?: string) {
    this.config = config;
    this.storePath = projectRoot ? join(projectRoot, '.pi', 'agent', 'memory') : MEMORY_STORE_DIR;
    this.indexPath = join(this.storePath, INDEX_FILE);
    this.state = this.initializeState();
  }

  private initializeState(): MemoryState {
    return {
      coreLearnings: [],
      corrections: [],
      preferences: [],
      patterns: [],
      dailyLog: [],
      currentSessionMessages: [],
      currentSessionId: '',
    };
  }

  // --- Loading ---

  async load(): Promise<void> {
    await this.loadJSONL(CORE_FILE, (record) => this.state.coreLearnings.push(record));
    await this.loadJSONL(CORRECTIONS_FILE, (record) => this.state.corrections.push(record));
    await this.loadJSONL(PREFERENCES_FILE, (record) => this.state.preferences.push(record));
    await this.loadJSONL(PATTERNS_FILE, (record) => this.state.patterns.push(record));
    await this.loadIndex();
  }

  private async loadJSONL(filename: string, push: (record: MemoryRecord) => void): Promise<void> {
    const filePath = join(this.storePath, filename);
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim());
      for (const line of lines) {
        try {
          push(JSON.parse(line));
        } catch {
          // Skip malformed lines
        }
      }
    } catch {
      // File doesn't exist yet
    }
  }

  private async loadIndex(): Promise<void> {
    try {
      const content = await readFile(this.indexPath, 'utf-8');
      const index = JSON.parse(content);
      this.state.currentSessionId = index.currentSessionId || '';
      this.state.dailyLog = index.dailyLog || [];
    } catch {
      // No index file
    }
  }

  // --- Saving ---

  async save(): Promise<void> {
    await this.saveJSONL(CORE_FILE, this.state.coreLearnings);
    await this.saveJSONL(CORRECTIONS_FILE, this.state.corrections);
    await this.saveJSONL(PREFERENCES_FILE, this.state.preferences);
    await this.saveJSONL(PATTERNS_FILE, this.state.patterns);
    await this.saveIndex();
  }

  private async saveJSONL(filename: string, records: MemoryRecord[]): Promise<void> {
    await mkdir(this.storePath, { recursive: true });
    const filePath = join(this.storePath, filename);
    const content = records.map((record) => JSON.stringify(record)).join('\n') + '\n';
    await writeFile(filePath, content, 'utf-8');
  }

  private async saveIndex(): Promise<void> {
    await mkdir(this.storePath, { recursive: true });
    const index = {
      currentSessionId: this.state.currentSessionId,
      dailyLog: this.state.dailyLog.slice(-this.config.maxDailyItems),
    };
    await writeFile(this.indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  // --- Memory Operations ---

  async addMemory(record: Omit<MemoryRecord, 'id' | 'created' | 'updated'>): Promise<MemoryRecord> {
    const now = Date.now();
    const memory: MemoryRecord = {
      ...record,
      id: this.generateId(),
      created: now,
      updated: now,
    };

    // Check for duplicates using content similarity
    if (this.hasDuplicate(memory)) {
      return memory; // Still add but flag as potential duplicate
    }

    // Add to appropriate store
    switch (record.kind) {
      case 'correction':
        this.state.corrections.push(memory);
        break;
      case 'preference':
        this.state.preferences.push(memory);
        break;
      case 'lesson':
      case 'pattern':
        this.state.patterns.push(memory);
        break;
      default:
        this.state.coreLearnings.push(memory);
    }

    // If high confidence and stable, promote to core
    if (record.confidence >= 0.9 && record.stability === 'stable') {
      this.state.coreLearnings.push(memory);
      // Keep core size bounded
      if (this.state.coreLearnings.length > this.config.maxCoreItems) {
        this.state.coreLearnings = this.state.coreLearnings.slice(-this.config.maxCoreItems);
      }
    }

    return memory;
  }

  async addDailyLog(content: string, messageCount: number): Promise<void> {
    const entry: DailyLogEntry = {
      timestamp: Date.now(),
      content,
      messageCount,
    };
    this.state.dailyLog.push(entry);
    // Keep daily log bounded
    if (this.state.dailyLog.length > this.config.maxDailyItems) {
      this.state.dailyLog = this.state.dailyLog.slice(-this.config.maxDailyItems);
    }
  }

  async searchMemory(query: string, limit: number = 5): Promise<MemoryRecord[]> {
    const queryTerms = query
      .toLowerCase()
      .split(' ')
      .filter((t) => t.length > 2);
    if (queryTerms.length === 0) return [];

    const allRecords = [
      ...this.state.coreLearnings,
      ...this.state.corrections,
      ...this.state.preferences,
      ...this.state.patterns,
    ];

    const results = allRecords.filter((record) => {
      const content = record.content.toLowerCase();
      return queryTerms.some((term) => content.includes(term));
    });

    // Sort by confidence (descending) then recency
    results.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.created - a.created;
    });

    return results.slice(0, limit);
  }

  async getInbox(): Promise<MemoryRecord[]> {
    try {
      const content = await readFile(join(this.storePath, INBOX_FILE), 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim());
      return lines.map((line) => JSON.parse(line));
    } catch {
      return [];
    }
  }

  async addToInbox(record: MemoryRecord): Promise<void> {
    const inboxPath = join(this.storePath, INBOX_FILE);
    await mkdir(this.storePath, { recursive: true });
    await appendFile(inboxPath, JSON.stringify(record) + '\n', 'utf-8');
  }

  // --- Injection ---

  async getMemoryForInjection(): Promise<string> {
    const allRecords = [
      ...this.state.coreLearnings,
      ...this.state.corrections,
      ...this.state.preferences,
      ...this.state.patterns,
    ];

    // Format memories for injection
    const formatted = allRecords.map((record) => {
      const prefix = `[${record.kind.toUpperCase()}]`;
      return `${prefix} ${record.content}`;
    });

    // Join and truncate to config limit
    let result = formatted.join('\n');
    if (result.length > this.config.injectionMaxChars) {
      result = result.slice(0, this.config.injectionMaxChars);
    }

    return result || 'No memories stored yet.';
  }

  // --- Utilities ---

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private hasDuplicate(newRecord: MemoryRecord): boolean {
    const allRecords = [
      ...this.state.coreLearnings,
      ...this.state.corrections,
      ...this.state.preferences,
      ...this.state.patterns,
    ];

    for (const existing of allRecords) {
      if (existing.content === newRecord.content) {
        return true;
      }
      // Simple Jaccard similarity for content comparison
      if (this.computeJaccardSimilarity(existing.content, newRecord.content) >= 0.7) {
        return true;
      }
    }
    return false;
  }

  private computeJaccardSimilarity(a: string, b: string): number {
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));

    let intersection = 0;
    for (const word of setA) {
      if (setB.has(word)) intersection++;
    }

    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
  }

  // --- Reflection ---

  async runReflection(modelRegistry: ModelRegistry): Promise<string> {
    if (this.state.dailyLog.length === 0) {
      return 'No daily logs available for reflection.';
    }

    // Extract patterns from daily logs
    const patterns = this.state.dailyLog.map((entry) => entry.content);
    const patternText = patterns.join('\n');

    // Use LLM to identify patterns and update core learnings
    const systemPrompt = `You are analyzing session patterns to improve core learnings.

Review the daily logs below and identify:
1. Recurring corrections or mistakes
2. Successful patterns worth preserving
3. Inefficient workflows that should be improved
4. Project conventions that should be remembered

Return a JSON object with the following schema:
{
  "updates": [
    {
      "kind": "correction" | "lesson" | "convention",
      "content": "Summary of the pattern",
      "confidence": 0.9,
      "tags": ["pattern", "workflow"]
    }
  ],
  "summary": "Brief summary of findings"
}

Rules:
- Only include patterns that appeared 2+ times
- Be specific about what to remember
- Focus on actionable learnings
- Output valid JSON only`;

    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `${systemPrompt}\n\n<daily-logs>\n${patternText}\n</daily-logs>`,
          },
        ],
        timestamp: Date.now(),
      },
    ];

    try {
      const model = modelRegistry.find('openai-compat', this.config.extractionModel);
      if (!model) {
        return 'Model not found, skipping reflection.';
      }

      const auth = await modelRegistry.getApiKeyAndHeaders(model);
      if (!auth?.ok || !auth.apiKey) {
        return 'No API key available, skipping reflection.';
      }

      const response = await complete(
        model,
        { messages },
        { apiKey: auth.apiKey, headers: auth.headers },
      );

      const content = response.content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text)
        .join('\n');

      const trimmed = content.trim();
      let jsonStr = trimmed;
      if (trimmed.startsWith('```')) {
        jsonStr = trimmed
          .split('\n')
          .filter((l) => !l.startsWith('```'))
          .join('\n')
          .trim();
      }
      if (jsonStr.startsWith('json')) {
        jsonStr = jsonStr.slice(4).trim();
      }

      const result = JSON.parse(jsonStr);
      if (!result.updates || !Array.isArray(result.updates)) {
        return 'Invalid reflection result.';
      }

      // Apply updates to core learnings
      for (const update of result.updates) {
        if (update.kind === 'lesson' || update.kind === 'convention') {
          await this.addMemory({
            ...update,
            source: 'session',
            stability: 'semi_stable',
          });
        } else if (update.kind === 'correction') {
          await this.addMemory({
            ...update,
            source: 'session',
            stability: 'semi_stable',
          });
        }
      }

      this.state.lastReflectionDate = Date.now();
      this.state.reflectionCount = (this.state.reflectionCount || 0) + 1;

      return `Reflection complete. Found ${result.updates.length} patterns. Summary: ${result.summary || 'No summary provided.'}`;
    } catch (error) {
      console.error('[memory] Reflection failed:', error);
      return `Reflection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // --- Stats ---

  getStats(): {
    coreLearnings: number;
    corrections: number;
    preferences: number;
    patterns: number;
    dailyLogEntries: number;
    inboxCount: number;
  } {
    return {
      coreLearnings: this.state.coreLearnings.length,
      corrections: this.state.corrections.length,
      preferences: this.state.preferences.length,
      patterns: this.state.patterns.length,
      dailyLogEntries: this.state.dailyLog.length,
      inboxCount: 0, // Will be computed in extension
    };
  }
}

// ============================================================================
// LLM Extraction Helper
// ============================================================================

async function extractMemoriesFromSession(
  messages: any[],
  modelId: string,
  modelRegistry: ModelRegistry,
): Promise<Array<Omit<MemoryRecord, 'id' | 'created' | 'updated'>>> {
  if (messages.length < 3) {
    return [];
  }

  // Format conversation
  const conversation = messages
    .map((m) => {
      if (m.role === 'user') {
        const content = Array.isArray(m.content)
          ? m.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('\n')
          : m.content;
        return `User: ${content}`;
      } else if (m.role === 'assistant') {
        const content = Array.isArray(m.content)
          ? m.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('\n')
          : m.content;
        return `Assistant: ${content}`;
      }
      return '';
    })
    .join('\n');

  const systemPrompt = `You are extracting persistent memories from a coding session. Extract:
- Corrections: Things the user corrected the agent to do differently
- Preferences: Coding style preferences, tool choices, workflow habits
- Lessons: Important learnings that should persist across sessions
- Patterns: Project-specific patterns, conventions, architecture decisions
- Conventions: Team/project conventions that should be remembered

Return ONLY a JSON array of memory objects with the following schema:
[
  {
    "kind": "correction" | "preference" | "lesson" | "pattern" | "convention",
    "content": "The memory content (concise, specific)",
    "confidence": 0.9,
    "source": "session" | "correction" | "explicit" | "inference",
    "tags": ["tag1", "tag2"],
    "stability": "volatile" | "semi_stable" | "stable"
  }
]

Rules:
- Only extract memories with confidence >= 0.8
- Be specific, not generic
- Focus on actionable learnings
- Skip trivial observations
- Deduplicate: don't extract if already stored
- Output valid JSON only, no markdown fences, no explanation`;

  try {
    const model = modelRegistry.find('openai-compat', modelId);
    if (!model) {
      console.log(`[memory] Model ${modelId} not found, skipping extraction`);
      return [];
    }

    const auth = await modelRegistry.getApiKeyAndHeaders(model);
    if (!auth?.ok || !auth.apiKey) {
      console.log('[memory] No API key available, skipping extraction');
      return [];
    }

    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `${systemPrompt}\n\n<conversation>\n${conversation}\n</conversation>`,
          },
        ],
        timestamp: Date.now(),
      },
    ];

    const response = await complete(
      model,
      { messages },
      {
        apiKey: auth.apiKey,
        headers: auth.headers,
      },
    );

    const content = response.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('\n');

    // Parse JSON
    const trimmed = content.trim();
    let jsonStr = trimmed;
    if (trimmed.startsWith('```')) {
      jsonStr = trimmed
        .split('\n')
        .filter((l) => !l.startsWith('```'))
        .join('\n')
        .trim();
    }
    if (jsonStr.startsWith('json')) {
      jsonStr = jsonStr.slice(4).trim();
    }

    const memories = JSON.parse(jsonStr);
    if (!Array.isArray(memories)) {
      return [];
    }

    return memories.filter(
      (m: any) => m.kind && m.content && m.confidence >= 0.8 && typeof m.content === 'string',
    );
  } catch (error) {
    console.error('[memory] Extraction failed:', error);
    return [];
  }
}

// ============================================================================
// Extension Factory
// ============================================================================

// biome-ignore lint/style/noDefaultExport: PI extension entry point requires default export
export default function (pi: ExtensionAPI) {
  let memoryStore: MemoryStore | null = null;

  pi.on('session_start', async (_event, _ctx) => {
    if (!memoryStore) return;

    const memories = await memoryStore.getMemoryForInjection();

    // Inject memories via a custom message at session start
    // This is the recommended pattern: one-shot injection before first user message
    const injection = `
<pi-memory>
${memories}
</pi-memory>`;

    pi.sendMessage(
      {
        customType: 'pi-memory-context',
        content: injection,
        display: false,
      },
      { deliverAs: 'nextTurn' },
    );
  });

  pi.on('agent_end', async (event, ctx) => {
    if (!memoryStore) return;
    if (!memoryStore.state.currentSessionId) {
      memoryStore.state.currentSessionId = ctx.sessionManager.getLeafId() || 'unknown';
    }

    // Collect messages for extraction
    memoryStore.state.currentSessionMessages = event.messages;

    // Add daily log entry
    const messageCount = event.messages.length;
    await memoryStore.addDailyLog(`Session ended with ${messageCount} messages`, messageCount);
  });

  pi.on('session_shutdown', async (_event, _ctx) => {
    if (!memoryStore) return;

    // Save all state
    await memoryStore.save();

    // Run extraction
    if (memoryStore.state.currentSessionMessages.length > 0) {
      const memories = await extractMemoriesFromSession(
        memoryStore.state.currentSessionMessages,
        memoryStore.config.extractionModel,
        pi.modelRegistry,
      );

      for (const memory of memories) {
        if (memory.confidence >= memoryStore.config.minConfidence) {
          await memoryStore.addMemory(memory);
        }
      }

      await memoryStore.save();
    }
  });

  // Register memory_search tool
  pi.registerTool({
    name: 'memory_search',
    label: 'Search Memory',
    description:
      'Search persistent memory for lessons, corrections, preferences, and patterns. Use this before coding to recall prior learnings and avoid repeating mistakes.',
    promptSnippet: 'Search persistent memory for lessons and corrections',
    parameters: Type.Object({
      query: Type.String({
        description: 'Search query (keywords)',
      }),
      limit: Type.Optional(
        Type.Number({
          description: 'Maximum results to return (default: 5)',
          minimum: 1,
          maximum: 20,
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      if (!memoryStore) {
        return {
          content: [{ type: 'text', text: 'Memory system not initialized.' }],
          details: {},
        };
      }

      const results = await memoryStore.searchMemory(params.query, params.limit || 5);

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
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      if (!memoryStore) {
        return {
          content: [{ type: 'text', text: 'Memory system not initialized.' }],
          details: {},
        };
      }

      const stats = memoryStore.getStats();
      const inboxCount = (await memoryStore.getInbox()).length;

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

  // Register memory_write tool for explicit memory storage
  pi.registerTool({
    name: 'memory_write',
    label: 'Write Memory',
    description:
      'Explicitly store a memory (correction, preference, lesson, pattern, or convention). Use this to remember important learnings.',
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
      if (!memoryStore) {
        return {
          content: [{ type: 'text', text: 'Memory system not initialized.' }],
          details: {},
        };
      }

      const kind = (params.kind || 'lesson') as MemoryKind;
      const memory = await memoryStore.addMemory({
        kind,
        content: params.content,
        confidence: params.confidence || 0.9,
        source: 'explicit',
        tags: params.tags || [],
        stability: 'semi_stable',
      });

      await memoryStore.save();

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

  // Register /memory command for interactive memory management
  pi.registerCommand('memory', {
    description: 'Memory system management',
    handler: async (args: string, ctx) => {
      if (!memoryStore) {
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
          const stats = memoryStore.getStats();
          const inboxCount = (await memoryStore.getInbox()).length;
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
          const results = await memoryStore.searchMemory(rest, 5);
          ctx.ui.notify(
            results.length > 0
              ? results.map((r, i) => `${i + 1}. [${r.kind}] ${r.content}`).join('\n')
              : 'No results',
            'info',
          );
          break;
        }
        case 'inbox': {
          const inbox = await memoryStore.getInbox();
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
          const result = await memoryStore.runReflection(ctx.modelRegistry);
          ctx.ui.notify(result, 'info');
          await memoryStore.save();
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

  // Register /memory-reflect command for quick reflection
  pi.registerCommand('memory-reflect', {
    description: 'Run reflection on recent sessions to update core learnings',
    handler: async (_args, ctx) => {
      if (!memoryStore) {
        ctx.ui.notify('Memory system not initialized.', 'error');
        return;
      }

      ctx.ui.notify('Running reflection...', 'info');
      const result = await memoryStore.runReflection(ctx.modelRegistry);
      ctx.ui.notify(result, 'info');
      await memoryStore.save();
    },
  });

  // Initialize memory store
  async function initializeMemory(ctx: any): Promise<void> {
    if (memoryStore) return;

    const config: MemoryConfig = {
      ...DEFAULT_CONFIG,
      projectLocal: ctx.cwd ? ctx.isProjectTrusted() : DEFAULT_CONFIG.projectLocal,
    };

    memoryStore = new MemoryStore(config, ctx.cwd);
    await memoryStore.load();

    // Set session ID
    memoryStore.state.currentSessionId = ctx.sessionManager.getLeafId() || 'unknown';
    memoryStore.state.projectRoot = ctx.cwd;

    if (ctx.hasUI) {
      ctx.ui.notify('Memory system loaded', 'info');
    }
  }

  pi.on('session_start', async (_event, ctx) => {
    await initializeMemory(ctx);
  });
}
