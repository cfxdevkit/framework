import {
  extractAssistantText,
  formatFetchError,
  parseModels,
  readStreamedChatCompletion,
} from './http-response.js';
import type { ChatMessage, CompletionAttempt, CompletionOptions, LlmModel } from './types.js';

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

export { extractAssistantText, formatFetchError, parseModels };

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

function emitProgress(
  opts: CompletionOptions | undefined,
  event: {
    readonly phase: 'request' | 'headers';
    readonly url: string;
    readonly attempt: number;
    readonly elapsedMs: number;
    readonly status?: number;
  },
): void {
  try {
    opts?.onProgress?.(event);
  } catch {
    // progress reporting must never break the completion path
  }
}
