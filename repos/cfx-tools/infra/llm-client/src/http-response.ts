import type { CompletionOptions, CompletionProgressEvent, LlmModel } from './types.js';

export function extractAssistantText(text: string): string {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!isRecord(parsed)) return text.trim();
    const choices = parsed.choices;
    if (!Array.isArray(choices)) return text.trim();
    const first = choices[0];
    if (!isRecord(first)) return text.trim();
    const message = first.message;
    const candidate =
      (isRecord(message) ? message.content : undefined) ??
      first.text ??
      (isRecord(parsed) ? parsed.message : undefined);
    const extracted = extractTextNode(candidate);
    if (extracted.trim()) return extracted.trim();
    if (candidate !== undefined) return '';
    return text.trim();
  } catch {
    return text.trim();
  }
}

export function parseModels(text: string, baseUrl?: string): readonly LlmModel[] {
  try {
    const parsed = JSON.parse(text) as unknown;
    const data = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.data)
        ? parsed.data
        : [];
    return data
      .filter(isRecord)
      .map((model) => ({
        id: typeof model.id === 'string' ? model.id : undefined,
        checkpoint: typeof model.checkpoint === 'string' ? model.checkpoint : undefined,
        labels: Array.isArray(model.labels)
          ? model.labels.filter((label): label is string => typeof label === 'string')
          : [],
        recipe: typeof model.recipe === 'string' ? model.recipe : undefined,
        size: typeof model.size === 'number' ? model.size : undefined,
        suggested: model.suggested === true,
        baseUrl,
      }))
      .filter((model) => model.id || model.checkpoint);
  } catch {
    return [];
  }
}

export function formatFetchError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause;
  if (isRecord(cause) && typeof cause.code === 'string') return `${error.message} (${cause.code})`;
  return error.message;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function readStreamedChatCompletion(
  response: Response,
  params: {
    readonly url: string;
    readonly attempt: number;
    readonly startedAt: number;
    readonly opts: CompletionOptions;
  },
): Promise<string> {
  if (!response.body) return extractAssistantText(await response.text());

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let content = '';
  let reasoning = '';
  let finishReason: string | undefined;
  let lastPhase: 'headers' | 'reasoning' | 'content' = 'headers';
  let lastHeartbeatAt = params.startedAt;

  while (true) {
    const { done, value } = await reader.read();
    pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    const blocks = pending.split(/\r?\n\r?\n/);
    pending = blocks.pop() ?? '';
    for (const block of blocks) {
      const result = applyChatCompletionChunk(block, { content, reasoning, finishReason });
      content = result.content;
      reasoning = result.reasoning;
      finishReason = result.finishReason;

      if (result.reasoningChanged && lastPhase !== 'reasoning') {
        lastPhase = 'reasoning';
        emitProgress(params.opts, {
          phase: 'reasoning',
          url: params.url,
          attempt: params.attempt,
          elapsedMs: Date.now() - params.startedAt,
          status: response.status,
          reasoningChars: reasoning.length,
          contentChars: content.length,
        });
      }

      if (result.contentChanged && lastPhase !== 'content') {
        lastPhase = 'content';
        emitProgress(params.opts, {
          phase: 'content',
          url: params.url,
          attempt: params.attempt,
          elapsedMs: Date.now() - params.startedAt,
          status: response.status,
          reasoningChars: reasoning.length,
          contentChars: content.length,
        });
      }
    }

    const now = Date.now();
    if (now - lastHeartbeatAt >= 15000) {
      lastHeartbeatAt = now;
      emitProgress(params.opts, {
        phase: 'heartbeat',
        url: params.url,
        attempt: params.attempt,
        elapsedMs: now - params.startedAt,
        status: response.status,
        reasoningChars: reasoning.length,
        contentChars: content.length,
      });
    }

    if (done) break;
  }

  if (pending.trim()) {
    const result = applyChatCompletionChunk(pending, { content, reasoning, finishReason });
    content = result.content;
    reasoning = result.reasoning;
    finishReason = result.finishReason;
  }

  emitProgress(params.opts, {
    phase: 'complete',
    url: params.url,
    attempt: params.attempt,
    elapsedMs: Date.now() - params.startedAt,
    status: response.status,
    reasoningChars: reasoning.length,
    contentChars: content.length,
    finishReason,
  });

  return content;
}

function extractTextNode(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((entry) => extractTextNode(entry))
      .filter((entry) => entry.trim())
      .join('')
      .trim();
  }
  if (!isRecord(value)) return '';
  if (typeof value.text === 'string') return value.text;
  if (typeof value.content === 'string') return value.content;
  if (Array.isArray(value.content)) return extractTextNode(value.content);
  return '';
}

function emitProgress(opts: CompletionOptions | undefined, event: CompletionProgressEvent): void {
  try {
    opts?.onProgress?.(event);
  } catch {
    // progress reporting must never break the completion path
  }
}

function applyChatCompletionChunk(
  block: string,
  state: { content: string; reasoning: string; finishReason?: string },
): {
  content: string;
  reasoning: string;
  finishReason?: string;
  contentChanged: boolean;
  reasoningChanged: boolean;
} {
  let content = state.content;
  let reasoning = state.reasoning;
  let finishReason = state.finishReason;
  let contentChanged = false;
  let reasoningChanged = false;

  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const parsed = JSON.parse(payload) as unknown;
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
    } catch {
      // ignore malformed streaming chunk
    }
  }

  return { content, reasoning, finishReason, contentChanged, reasoningChanged };
}
