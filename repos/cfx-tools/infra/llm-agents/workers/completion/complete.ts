import { readConfig, resolveRequestTimeoutMs } from './config.ts';
import { getProviderBaseUrl, resolveProviderModel } from './provider-meta.ts';
import { resolveProvider } from './providers.ts';
import { resolveActionConfig } from './resolve-action.ts';
import type { ChatMessage, CompleteAgentRequest, CompletionReport } from './types.ts';

export async function complete({ action, modelOverride, userPrompt, context, quick = false }) {
  const config = await readConfig();
  const actionConfig = resolveActionConfig(action, config);
  // Use an action-specific config override when a cloud profile is active
  const effectiveConfig = actionConfig.isCloud
    ? {
        ...config,
        baseUrl: actionConfig.baseUrl,
        provider: actionConfig.provider as typeof config.provider,
      }
    : config;
  const provider = await resolveProvider(
    effectiveConfig,
    actionConfig.isCloud ? { apiKey: actionConfig.apiKey } : undefined,
  );
  const modelId = await resolveProviderModel(provider, modelOverride ?? actionConfig.model);
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
    tokenBudget: config.tokenBudget,
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
  } satisfies CompletionReport;
}

export async function completeCommitAgent(request: CompleteAgentRequest) {
  return completeDirect(request);
}

export async function completeStructuredAgent(request: CompleteAgentRequest) {
  return completeDirect(request);
}

async function completeDirect({
  action,
  flags,
  systemPrompt,
  userPrompt,
  maxTokens,
  onProgress,
}: CompleteAgentRequest): Promise<CompletionReport> {
  const config = await readConfig();
  const actionConfig = resolveActionConfig(action, config);
  const effectiveConfig = actionConfig.isCloud
    ? {
        ...config,
        baseUrl: actionConfig.baseUrl,
        provider: actionConfig.provider as typeof config.provider,
      }
    : config;
  const provider = await resolveProvider(
    effectiveConfig,
    actionConfig.isCloud ? { apiKey: actionConfig.apiKey } : undefined,
  );
  const modelId = await resolveProviderModel(provider, flags.model ?? actionConfig.model);
  const requestTimeoutMs = resolveRequestTimeoutMs(config);
  const messages: readonly ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  const content = await provider.complete(messages, {
    action,
    model: modelId,
    maxTokens,
    tokenBudget: config.tokenBudget,
    temperature: 0.1,
    timeoutMs: requestTimeoutMs,
    enableThinking: flags.noThinking ? false : undefined,
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
