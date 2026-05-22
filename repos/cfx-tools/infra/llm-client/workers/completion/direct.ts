import type { ChatMessage, CompletionProgressEvent } from '../../src/types.ts';
import { getProviderBaseUrl, resolveProviderModel } from '../../src/provider-meta.ts';
import { resolveProvider } from '../../src/resolve.ts';
import { readConfig, resolveRequestTimeoutMs } from './client.ts';

type CompleteDirectParams = {
  action: string;
  modelOverride?: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  enableThinking?: boolean;
  onProgress?: (event: CompletionProgressEvent) => void;
};

export async function completeDirect({
  action,
  modelOverride,
  systemPrompt,
  userPrompt,
  maxTokens,
  enableThinking,
  onProgress,
}: CompleteDirectParams) {
  const config = await readConfig();
  const provider = await resolveProvider();
  const modelId = await resolveProviderModel(
    provider,
    modelOverride ?? config.actions?.[action] ?? config.defaultModel,
  );
  const requestTimeoutMs = resolveRequestTimeoutMs(config);
  const messages: readonly ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  const content = await provider.complete(messages, {
    action,
    model: modelId,
    maxTokens,
    temperature: 0.1,
    timeoutMs: requestTimeoutMs,
    enableThinking,
    onProgress,
  });

  return {
    generatedAt: new Date().toISOString(),
    action,
    baseUrl: getProviderBaseUrl(provider),
    model: modelId,
    content,
    attempts: [],
  };
}
