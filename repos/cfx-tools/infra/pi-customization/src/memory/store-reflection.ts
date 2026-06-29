import { complete } from '@earendil-works/pi-ai/base';
import type { ModelRegistry } from '@earendil-works/pi-coding-agent';
import type { MemoryConfig } from './types.js';

// Parse LLM JSON response, stripping markdown fences
export function parseLLMResponse(content: string): string {
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

import type { MemoryStore } from './store-core.js';

export async function runReflection(
  store: MemoryStore,
  config: MemoryConfig,
  modelRegistry: ModelRegistry,
): Promise<string> {
  if (store.stateValue.dailyLog.length === 0) {
    return 'No daily logs available for reflection.';
  }

  const patternText = store.stateValue.dailyLog.map((e) => e.content).join('\n');
  const systemPrompt = `Analyze session patterns for recurring corrections, successful workflows, and conventions. Return JSON: { "updates": [{ "kind": "correction"|"lesson"|"convention", "content": "...", "confidence": 0.9, "tags": [] }], "summary": "..." }`;

  try {
    const model = modelRegistry.find('openai-compat', config.extractionModel);
    if (!model) return 'Model not found, skipping reflection.';

    const auth = await modelRegistry.getApiKeyAndHeaders(model);
    if (!auth?.ok || !auth.apiKey) return 'No API key available.';

    const response = await complete(
      model,
      {
        messages: [
          {
            role: 'user' as const,
            content: [
              { type: 'text' as const, text: `${systemPrompt}\n\n<logs>\n${patternText}\n</logs>` },
            ],
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
    if (!result.updates || !Array.isArray(result.updates)) return 'Invalid reflection result.';

    for (const update of result.updates) {
      await store.addMemory({
        ...update,
        source: 'session' as const,
        stability: 'semi_stable' as const,
      });
    }

    await store.save();
    return `Reflection complete. Found ${result.updates.length} patterns. Summary: ${result.summary || 'None'}`;
  } catch (error) {
    console.error('[memory] Reflection failed:', error);
    return `Reflection failed: ${error instanceof Error ? error.message : 'Unknown'}`;
  }
}
