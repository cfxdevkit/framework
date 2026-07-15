/**
 * Stateless parsing helpers for the chat-completion stream.
 * Extracted here to keep provider-stream.ts under the line-count limit.
 */
import { isRecord } from './guards.js';
import { extractTextNode } from './provider/meta';
import type { CompletionOptions, CompletionProgressEvent } from './types.js';

export type ChunkTimings = {
  readonly promptTokens: number;
  readonly completionTokens: number;
  /** Generation speed — tokens per second. */
  readonly tps: number;
  /** Prompt-processing speed — tokens per second. */
  readonly pp: number;
};

export type ChunkResult = {
  content: string;
  reasoning: string;
  finishReason?: string;
  contentChanged: boolean;
  reasoningChanged: boolean;
  timings?: ChunkTimings;
};

export function applyChatCompletionChunk(
  block: string,
  state: { content: string; reasoning: string; finishReason?: string },
): ChunkResult {
  let content = state.content;
  let reasoning = state.reasoning;
  let finishReason = state.finishReason;
  let contentChanged = false;
  let reasoningChanged = false;
  let timings: ChunkTimings | undefined;

  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const parsed = JSON.parse(payload);
      const choice =
        isRecord(parsed) && Array.isArray(parsed.choices) ? parsed.choices[0] : undefined;
      if (!isRecord(choice)) continue;
      if (typeof choice.finish_reason === 'string') finishReason = choice.finish_reason;
      const delta = isRecord(choice.delta) ? choice.delta : undefined;
      const contentDelta = extractTextNode(delta?.content);
      const reasoningDelta = extractTextNode(delta?.reasoning_content);
      if (reasoningDelta) {
        reasoning += reasoningDelta;
        reasoningChanged = true;
      }
      if (contentDelta) {
        content += contentDelta;
        contentChanged = true;
      }
      // Extract server-provided timing metrics from the final chunk
      if (isRecord(parsed.timings)) {
        const t = parsed.timings;
        const predN = typeof t.predicted_n === 'number' ? t.predicted_n : 0;
        const promptN = typeof t.prompt_n === 'number' ? t.prompt_n : 0;
        const predPs = typeof t.predicted_per_second === 'number' ? t.predicted_per_second : 0;
        const promptPs = typeof t.prompt_per_second === 'number' ? t.prompt_per_second : 0;
        if (predN > 0 || promptN > 0) {
          timings = {
            completionTokens: predN,
            promptTokens: promptN,
            tps: Math.round(predPs * 10) / 10,
            pp: Math.round(promptPs * 10) / 10,
          };
        }
      }
    } catch {
      // ignore malformed chunks
    }
  }

  return { content, reasoning, finishReason, contentChanged, reasoningChanged, timings };
}

export function emitProgress(
  opts: CompletionOptions | undefined,
  event: CompletionProgressEvent,
): void {
  try {
    opts?.onProgress?.(event);
  } catch {
    // progress reporting must not break completions
  }
}

export function extractAssistantText(text: string): string {
  try {
    const parsed = JSON.parse(text);
    if (!isRecord(parsed) || !Array.isArray(parsed.choices)) {
      // Detect Lemonade's "200 OK but model not loaded" error envelope
      if (isRecord(parsed) && isRecord(parsed.error)) return '';
      return text.trim();
    }
    const first = parsed.choices[0];
    if (!isRecord(first)) {
      return text.trim();
    }
    const message = isRecord(first.message) ? first.message.content : undefined;
    const candidate = message ?? first.text ?? parsed.message ?? parsed.content;
    const extracted = extractTextNode(candidate);
    if (extracted.trim()) return extracted.trim();
    if (candidate !== undefined) return '';
    return text.trim();
  } catch {
    return text.trim();
  }
}
