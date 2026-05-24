import { isRecord } from './guards.ts';
import { formatFetchError, joinEndpoint } from './provider-meta.ts';
import {
  applyChatCompletionChunk,
  emitProgress,
  extractAssistantText,
} from './provider-stream-parse.ts';
import type { ChatMessage, CompletionAttemptState, CompletionOptions } from './types.ts';

/**
 * Compute max_tokens from opts.tokenBudget + model context window.
 *
 * Resolution order:
 *  1. opts.maxTokens if explicitly set
 *  2. ctx * contextFraction, optionally capped (from tokenBudget)
 *  3. tokenBudget.cloudFallback or 4096 when ctx is unknown
 *
 * For local hardware (Strix Halo etc.) set tokenBudget.cap = null and
 * contextFraction close to 1.0 in providers.json.
 * Cloud providers fall back to cloudFallback (default 4096) since they
 * rarely expose a context window via discovery.
 */
function resolveMaxTokens(opts: CompletionOptions | undefined): number {
  if (opts?.maxTokens !== undefined) return opts.maxTokens;
  const budget = opts?.tokenBudget;
  const ctx = opts?.modelContextWindow;
  if (ctx && ctx > 0) {
    const fraction = budget?.contextFraction ?? 0.75;
    const computed = Math.floor(ctx * fraction);
    const cap = budget?.cap; // null → no cap, undefined → use default code cap
    if (cap === null) return computed; // explicitly uncapped
    if (cap !== undefined) return Math.min(computed, cap); // explicit cap
    return Math.min(computed, 32768); // default fallback cap for unset configs
  }
  // No context window — cloud model or unknown provider
  if (opts?.quick) return budget?.quick ?? 512;
  return budget?.cloudFallback ?? 4096;
}

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
        max_tokens: resolveMaxTokens(params.opts),
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
  let peekedForErrorEnvelope = false;
  let finishReason: string | undefined;
  let serverTimings:
    | { promptTokens: number; completionTokens: number; tps: number; pp: number }
    | undefined;
  let lastPhase: 'headers' | 'reasoning' | 'content' = 'headers';
  let lastHeartbeatAt = params.startedAt;

  while (true) {
    const { done, value } = await reader.read();
    pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    // Detect Lemonade error envelope sent as a 200 stream body
    // e.g. {"error":{"message":"No model loaded:...","type":"model_not_loaded"}}
    if (!peekedForErrorEnvelope && pending.trim().startsWith('{')) {
      peekedForErrorEnvelope = true;
      try {
        const peeked = JSON.parse(pending.trim()) as Record<string, unknown>;
        if (isRecord(peeked.error)) return ''; // treat as empty — triggers retry
      } catch {
        // not complete JSON yet, continue streaming
      }
    }

    const blocks = pending.split(/\r?\n\r?\n/);
    pending = blocks.pop() ?? '';
    for (const block of blocks) {
      const result = applyChatCompletionChunk(block, { content, reasoning, finishReason });
      content = result.content;
      reasoning = result.reasoning;
      finishReason = result.finishReason;
      if (result.timings) serverTimings = result.timings;

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
    if (result.timings) serverTimings = result.timings;
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
    ...(serverTimings ?? {}),
  });

  return content;
}
