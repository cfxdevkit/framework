import type { ChatMessage } from '../../src/types.ts';
import type { CompletionProgressEvent } from '../../src/types.ts';
import { getProviderBaseUrl, resolveProviderModel } from '../../src/provider-meta.ts';
import { resolveProvider } from '../../src/resolve.ts';
import { readConfig, resolveRequestTimeoutMs } from './client.ts';
import { completeDirect } from './direct.ts';

type CompleteAgentRequest = {
  action: string;
  flags: { model?: string; noThinking?: boolean };
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  onProgress?: (event: CompletionProgressEvent) => void;
};

export async function completeCommitAgent({
  action,
  flags,
  systemPrompt,
  userPrompt,
  maxTokens,
  onProgress,
}: CompleteAgentRequest) {
  return completeDirect({
    action,
    modelOverride: flags.model,
    systemPrompt,
    userPrompt,
    maxTokens,
    enableThinking: flags.noThinking ? false : undefined,
    onProgress,
  });
}

export async function completeStructuredAgent({
  action,
  flags,
  systemPrompt,
  userPrompt,
  maxTokens,
  onProgress,
}: CompleteAgentRequest) {
  return completeDirect({
    action,
    modelOverride: flags.model,
    systemPrompt,
    userPrompt,
    maxTokens,
    enableThinking: flags.noThinking ? false : undefined,
    onProgress,
  });
}
export async function complete({ action, modelOverride, userPrompt, context, quick = false }) {
  const config = await readConfig();
  const provider = await resolveProvider();
  const modelId = await resolveProviderModel(
    provider,
    modelOverride ?? config.actions?.[action] ?? config.defaultModel,
  );
  const requestTimeoutMs = resolveRequestTimeoutMs(config);

  const messages: readonly ChatMessage[] = [
    {
      role: 'system',
      content: [
        'You are a repository upkeep assistant for the Conflux DevKit monorepo.',
        'Use the supplied repository context as source of truth.',
        'Do not claim fine-tuning has happened. Do not publish, deploy, rotate secrets, or commit changes.',
        'For review-like tasks, put findings first and keep recommendations specific.',
      ].join(' '),
    },
    { role: 'user', content: `${context}\n\nTask:\n${userPrompt}` },
  ];
  const content = await provider.complete(messages, {
    action,
    model: modelId,
    quick,
    maxTokens: quick ? 256 : 1600,
    temperature: 0.2,
    timeoutMs: requestTimeoutMs,
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
