import { isRecord } from './guards.ts';
import { extractTextNode, formatFetchError, joinEndpoint } from './provider-meta.ts';
import type {
  ChatMessage,
  CompletionAttemptState,
  CompletionOptions,
  CompletionProgressEvent,
} from './types.ts';

export async function postChatCompletion(params: {
  readonly baseUrl: string;
  readonly chatPath: string;
  readonly model: string;
  readonly messages: readonly ChatMessage[];
  readonly opts?: CompletionOptions;
  readonly headers?: HeadersInit;
  readonly attempts: CompletionAttemptState[];
}): Promise<string | undefined> {
  const url = joinEndpoint(params.baseUrl, params.chatPath);
  const startedAt = Date.now();
  const attempt = params.attempts.length + 1;
  try {
    emitProgress(params.opts, {
      phase: 'request',
      url,
      attempt,
      elapsedMs: 0,
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...params.headers,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.opts?.temperature ?? 0.2,
        stream: Boolean(params.opts?.onProgress),
        max_tokens: params.opts?.maxTokens ?? (params.opts?.quick ? 256 : 1600),
        ...(typeof params.opts?.minContextTokens === 'number'
          ? { n_ctx: Math.max(0, Math.trunc(params.opts.minContextTokens)) }
          : {}),
        ...(params.opts?.enableThinking === false ? { enable_thinking: false } : {}),
      }),
      signal: AbortSignal.timeout(params.opts?.timeoutMs ?? 120000),
    });
    emitProgress(params.opts, {
      phase: 'headers',
      url,
      attempt,
      elapsedMs: Date.now() - startedAt,
      status: response.status,
    });
    const content = response.ok
      ? params.opts?.onProgress
        ? await readStreamedChatCompletion(response, {
            url,
            attempt,
            startedAt,
            opts: params.opts,
          })
        : extractAssistantText(await response.text())
      : undefined;
    params.attempts.push({
      url,
      ok: response.ok,
      status: response.status,
      empty: response.ok && !content?.trim(),
      retry: attempt,
    });
    if (!response.ok || !content?.trim()) {
      return undefined;
    }
    return content;
  } catch (error) {
    params.attempts.push({ url, ok: false, error: formatFetchError(error) });
    return undefined;
  }
}

async function readStreamedChatCompletion(
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
    } catch {
      // ignore malformed chunks
    }
  }

  return { content, reasoning, finishReason, contentChanged, reasoningChanged };
}

function emitProgress(opts: CompletionOptions | undefined, event: CompletionProgressEvent): void {
  try {
    opts?.onProgress?.(event);
  } catch {
    // progress reporting must not break completions
  }
}

function extractAssistantText(text: string): string {
  try {
    const parsed = JSON.parse(text);
    if (!isRecord(parsed) || !Array.isArray(parsed.choices)) {
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
