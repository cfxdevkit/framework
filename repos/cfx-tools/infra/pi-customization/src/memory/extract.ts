import { complete } from '@earendil-works/pi-ai/base';
import type { ModelRegistry } from '@earendil-works/pi-coding-agent';
import type { MemoryRecord } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

async function parseLLMResponse(content: string): Promise<string> {
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
  return jsonStr;
}

// ============================================================================
// LLM Extraction Helper
// ============================================================================

export async function extractMemoriesFromSession(
  messages: unknown[],
  modelId: string,
  modelRegistry: ModelRegistry,
): Promise<Array<Omit<MemoryRecord, 'id' | 'created' | 'updated'>>> {
  if (messages.length < 3) return [];

  // Format conversation
  const conversation = messages
    .map((m) => {
      const msg = m as { role: string; content: string | unknown[] };
      if (msg.role === 'user') {
        const content = Array.isArray(msg.content)
          ? msg.content
              .map((c: unknown) =>
                typeof c === 'object' && c !== null && 'type' in c && 'text' in c
                  ? (c as { text: string }).text
                  : '',
              )
              .join('\n')
          : msg.content;
        return `User: ${content}`;
      } else if (msg.role === 'assistant') {
        const content = Array.isArray(msg.content)
          ? msg.content
              .map((c: unknown) =>
                typeof c === 'object' && c !== null && 'type' in c && 'text' in c
                  ? (c as { text: string }).text
                  : '',
              )
              .join('\n')
          : msg.content;
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

    const response = await complete(
      model,
      {
        messages: [
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
        ],
      },
      { apiKey: auth.apiKey, headers: auth.headers },
    );

    const content = response.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('\n');

    const jsonStr = await parseLLMResponse(content);
    const memories = JSON.parse(jsonStr);
    if (!Array.isArray(memories)) return [];

    return memories.filter(
      (m: unknown) =>
        typeof m === 'object' &&
        m !== null &&
        'kind' in m &&
        'content' in m &&
        'confidence' in m &&
        typeof (m as Record<string, unknown>).content === 'string' &&
        (m as Record<string, number>).confidence >= 0.8,
    ) as Array<Omit<MemoryRecord, 'id' | 'created' | 'updated'>>;
  } catch (error) {
    console.error('[memory] Extraction failed:', error);
    return [];
  }
}
