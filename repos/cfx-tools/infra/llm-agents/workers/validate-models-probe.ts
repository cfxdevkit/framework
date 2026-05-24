import type { CompletionProgressEvent, LlmConfig, LlmProvider } from './completion/index.ts';

export type ValidationMetrics = {
  headersMs: number | null;
  firstReasoningMs: number | null;
  firstContentMs: number | null;
  completeMs: number | null;
  reasoningObserved: boolean;
  finishReason: string | null;
  contentChars: number;
  reasoningChars: number;
  promptTokens: number | null;
  completionTokens: number | null;
  /** Generation speed in tokens/second (from server timings). */
  tps: number | null;
  /** Prompt-processing speed in tokens/second (from server timings). */
  pp: number | null;
};

export type JsonValidation = {
  jsonValid: boolean;
  jsonShapeOk: boolean;
};

export type ValidationProbeResult = ValidationMetrics &
  Partial<JsonValidation> & {
    ok: boolean;
    firstResponseMs: number | null;
    contentPreview?: string;
    error?: string;
  };

export async function runValidationProbe(params: {
  provider: LlmProvider;
  config: LlmConfig;
  action: string;
  model: string;
  prompt: string;
  maxTokens: number;
  quick: boolean;
  enableThinking?: boolean;
  minContextTokens: number | null;
  validate?: (content: string) => JsonValidation;
}): Promise<ValidationProbeResult> {
  const metrics = createValidationMetrics();

  try {
    const response = await params.provider.complete([{ role: 'user', content: params.prompt }], {
      action: params.action,
      model: params.model,
      temperature: 0,
      maxTokens: params.maxTokens,
      tokenBudget: params.config.tokenBudget,
      quick: params.quick,
      timeoutMs: params.config.requestTimeoutMs,
      enableThinking: params.enableThinking,
      ...(params.minContextTokens ? { minContextTokens: params.minContextTokens } : {}),
      onProgress: (event) => applyValidationProgress(metrics, event),
    });

    const content = response.trim();
    const probe: ValidationProbeResult = {
      ok: true,
      ...metrics,
      firstResponseMs: firstResponseMs(metrics),
      contentPreview: content.slice(0, 80),
    };
    return params.validate ? { ...probe, ...params.validate(content) } : probe;
  } catch (error) {
    return {
      ok: false,
      ...metrics,
      firstResponseMs: firstResponseMs(metrics),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function createValidationMetrics(): ValidationMetrics {
  return {
    headersMs: null,
    firstReasoningMs: null,
    firstContentMs: null,
    completeMs: null,
    reasoningObserved: false,
    finishReason: null,
    contentChars: 0,
    reasoningChars: 0,
    promptTokens: null,
    completionTokens: null,
    tps: null,
    pp: null,
  };
}

function applyValidationProgress(metrics: ValidationMetrics, event: CompletionProgressEvent): void {
  if (event.phase === 'headers' && metrics.headersMs === null) {
    metrics.headersMs = event.elapsedMs;
  }
  if (event.phase === 'reasoning') {
    metrics.reasoningObserved = true;
    metrics.reasoningChars = event.reasoningChars ?? metrics.reasoningChars;
    if (metrics.firstReasoningMs === null) metrics.firstReasoningMs = event.elapsedMs;
  }
  if (event.phase === 'content') {
    metrics.contentChars = event.contentChars ?? metrics.contentChars;
    if (metrics.firstContentMs === null) metrics.firstContentMs = event.elapsedMs;
  }
  if (event.phase === 'heartbeat') {
    metrics.reasoningChars = event.reasoningChars ?? metrics.reasoningChars;
    metrics.contentChars = event.contentChars ?? metrics.contentChars;
  }
  if (event.phase === 'complete') {
    metrics.completeMs = event.elapsedMs;
    metrics.finishReason = event.finishReason ?? metrics.finishReason;
    metrics.reasoningChars = event.reasoningChars ?? metrics.reasoningChars;
    metrics.contentChars = event.contentChars ?? metrics.contentChars;
    if (event.promptTokens !== undefined) metrics.promptTokens = event.promptTokens;
    if (event.completionTokens !== undefined) metrics.completionTokens = event.completionTokens;
    if (event.tps !== undefined) metrics.tps = event.tps;
    if (event.pp !== undefined) metrics.pp = event.pp;
  }
}

function firstResponseMs(result: ValidationMetrics): number | null {
  return result.firstContentMs ?? result.firstReasoningMs;
}
