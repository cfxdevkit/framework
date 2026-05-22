import type {
  ChatMessage,
  CompletionAttempt,
  CompletionOptions,
  CompletionProgressEvent,
  LlmModel,
} from './types.js';

export const githubModelsEndpoint = 'https://models.inference.ai.azure.com';

export function normalizeBaseUrl(url: string): string {
  const value = url.trim();
  if (!value) return value;
  return value.endsWith('/') ? value : `${value}/`;
}

export function joinEndpoint(baseUrl: string, path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  return new URL(cleanPath, normalizeBaseUrl(baseUrl)).toString();
}

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

export async function postChatCompletion(params: {
  readonly baseUrl: string;
  readonly chatPath: string;
  readonly model: string;
  readonly messages: readonly ChatMessage[];
  readonly opts?: CompletionOptions;
  readonly headers?: HeadersInit;
  readonly attempts: CompletionAttempt[];
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
    if (!response.ok) return undefined;
    if (!content?.trim()) return undefined;
    return content;
  } catch (error) {
    params.attempts.push({ url, ok: false, error: formatFetchError(error) });
    return undefined;
  }
}

export function chooseBestModel(
  models: readonly LlmModel[],
  preferred?: string | null,
): LlmModel | undefined {
  if (preferred) {
    const exact = models.find((model) => model.id === preferred || model.checkpoint === preferred);
    if (exact) return exact;
  }
  return models.find((model) => model.suggested) ?? models[0];
}

export function modelIdentifier(model: LlmModel | undefined, fallback: string): string {
  return model?.id ?? model?.checkpoint ?? fallback;
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

function emitProgress(
  opts: CompletionOptions | undefined,
  event: CompletionProgressEvent,
): void {
  try {
    opts?.onProgress?.(event);
  } catch {
    // progress reporting must never break the completion path
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
      const parsed = JSON.parse(payload) as unknown;
      const choice = isRecord(parsed) && Array.isArray(parsed.choices) ? parsed.choices[0] : undefined;
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
