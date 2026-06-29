import { complete } from '@earendil-works/pi-ai/base';
import type { ExtensionAPI, ModelRegistry } from '@earendil-works/pi-coding-agent';
import { registerMemoryCommands } from './commands.js';
import { getModelRegistry, MemoryStore } from './store-index.js';
import { registerMemoryTools } from './tools.js';
import { DEFAULT_CONFIG } from './types.js';

export { registerMemoryCommands } from './commands.js';
export { getModelRegistry, MemoryStore } from './store-index.js';
export { registerMemoryTools } from './tools.js';

// Helper to parse LLM JSON responses
function parseLLMResponse(content: string): string {
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr
      .split('\n')
      .filter((l) => !l.startsWith('```'))
      .join('\n')
      .trim();
  }
  if (jsonStr.startsWith('json')) {
    jsonStr = jsonStr.slice(4).trim();
  }
  return jsonStr;
}

// Helper to extract memories using LLM
async function extractMemories(
  messages: unknown[],
  modelId: string,
  registry: ModelRegistry,
): Promise<unknown[]> {
  if (messages.length < 3) return [];

  const conversation = messages
    .map((m) => {
      const msg = m as { role: string; content: string | unknown[] };
      const content = Array.isArray(msg.content)
        ? msg.content
            .map((c: unknown) =>
              typeof c === 'object' && c !== null && 'type' in c && 'text' in c
                ? (c as { text: string }).text
                : '',
            )
            .join('\n')
        : msg.content;
      return `${msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Assistant' : 'System'}: ${content}`;
    })
    .join('\n');

  const systemPrompt = `Extract persistent memories from this conversation:
- Corrections, preferences, lessons, patterns, conventions
Return ONLY a JSON array: [{"kind":"lesson","content":"...","confidence":0.9,"source":"session","tags":[],"stability":"semi_stable"}]`;

  try {
    const model = registry.find('openai-compat', modelId);
    if (!model) return [];
    const auth = await registry.getApiKeyAndHeaders(model);
    if (!auth?.ok || !auth.apiKey) return [];

    const response = await complete(
      model,
      {
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: `${systemPrompt}\n\n${conversation}` }],
            timestamp: Date.now(),
          },
        ],
      },
      { apiKey: auth.apiKey, headers: auth.headers },
    );

    const text = response.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('\n');

    const result = JSON.parse(parseLLMResponse(text));
    if (!Array.isArray(result)) return [];
    return result.filter((m: unknown) => typeof m === 'object' && m !== null && 'kind' in m);
  } catch {
    return [];
  }
}

// ============================================================================
// Extension Factory
// ============================================================================

// biome-ignore lint/style/noDefaultExport: PI extension entry point requires default export
export default function (pi: ExtensionAPI) {
  let memoryStore: MemoryStore | null = null;

  const getStore = () => memoryStore;

  registerMemoryTools(pi, getStore);
  registerMemoryCommands(pi, getStore);

  pi.on('session_start', async (_event, ctx) => {
    if (!memoryStore) {
      await initializeMemory(ctx);
    }

    if (memoryStore) {
      const memories = await memoryStore.getMemoryForInjection();
      pi.sendMessage(
        {
          customType: 'pi-memory-context',
          content: `\n<pi-memory>\n${memories}\n</pi-memory>`,
          display: false,
        },
        { deliverAs: 'nextTurn' },
      );
    }
  });

  pi.on('agent_end', async (event, ctx) => {
    if (!memoryStore) return;
    if (!memoryStore.stateValue.currentSessionId) {
      memoryStore.stateValue.currentSessionId = ctx.sessionManager.getLeafId() || 'unknown';
    }
    memoryStore.stateValue.currentSessionMessages = event.messages;
    await memoryStore.addDailyLog(
      `Session ended with ${event.messages.length} messages`,
      event.messages.length,
    );
  });

  pi.on('session_shutdown', async () => {
    if (!memoryStore) return;
    await memoryStore.save();

    const registry = getModelRegistry();
    if (memoryStore.stateValue.currentSessionMessages.length > 0 && registry) {
      const memories = await extractMemories(
        memoryStore.stateValue.currentSessionMessages,
        memoryStore.configValue.extractionModel,
        registry,
      );

      for (const memory of memories) {
        if (
          (memory as { confidence: number }).confidence >= memoryStore.configValue.minConfidence
        ) {
          await memoryStore.addMemory(memory as Parameters<typeof memoryStore.addMemory>[0]);
        }
      }

      await memoryStore.save();
    }
  });

  async function initializeMemory(ctx: {
    sessionManager: { getLeafId: () => string };
    hasUI?: boolean;
    ui: { notify: (msg: string, level: string) => void };
    cwd?: string;
    isProjectTrusted: () => boolean;
  }): Promise<void> {
    if (memoryStore) return;

    const config = {
      ...DEFAULT_CONFIG,
      projectLocal: ctx.cwd ? ctx.isProjectTrusted() : DEFAULT_CONFIG.projectLocal,
    };

    memoryStore = new MemoryStore(config, ctx.cwd);
    await memoryStore.load();

    memoryStore.stateValue.currentSessionId = ctx.sessionManager.getLeafId() || 'unknown';
    memoryStore.stateValue.projectRoot = ctx.cwd;

    if (ctx.hasUI) {
      ctx.ui.notify('Memory system loaded', 'info');
    }
  }
}
