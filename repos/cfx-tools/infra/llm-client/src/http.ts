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

export function extractAssistantText(text: string): string {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!isRecord(parsed)) return text;
    const choices = parsed.choices;
    if (!Array.isArray(choices)) return text;
    const first = choices[0];
    if (!isRecord(first)) return text;
    const message = first.message;
    if (isRecord(message) && typeof message.content === 'string') return message.content;
    if (typeof first.text === 'string') return first.text;
    return text;
  } catch {
    return text;
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
  try {
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
        stream: false,
        max_tokens: params.opts?.maxTokens ?? (params.opts?.quick ? 256 : 1600),
      }),
      signal: AbortSignal.timeout(120000),
    });
    const text = await response.text();
    params.attempts.push({ url, ok: response.ok, status: response.status });
    if (!response.ok) return undefined;
    return extractAssistantText(text);
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
