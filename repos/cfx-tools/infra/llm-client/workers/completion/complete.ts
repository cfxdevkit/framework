import { chatPaths } from '../shared/index.ts';
import {
  chooseModel,
  createClient,
  discoverModels,
  extractAssistantText,
  readConfig,
  resolveRequestTimeoutMs,
} from './client.ts';
import { completeDirect } from './direct.ts';

export async function completeCommitAgent({ action, flags, systemPrompt, userPrompt, maxTokens }) {
  return completeDirect({
    action,
    modelOverride: flags.model,
    systemPrompt,
    userPrompt,
    maxTokens,
  });
}

export async function completeStructuredAgent({
  action,
  flags,
  systemPrompt,
  userPrompt,
  maxTokens,
}) {
  return completeDirect({
    action,
    modelOverride: flags.model,
    systemPrompt,
    userPrompt,
    maxTokens,
  });
}
export async function complete({ action, modelOverride, userPrompt, context, quick = false }) {
  const config = await readConfig();
  const client = await createClient(config);
  const models = await discoverModels(client.baseUrls);
  const modelId =
    modelOverride ?? config.actions?.[action] ?? config.defaultModel ?? chooseModel(models)?.id;
  if (!modelId)
    throw new Error('No Lemonade model available. Run pnpm run llm:models to inspect inventory.');
  const requestTimeoutMs = resolveRequestTimeoutMs(config);

  const messages = [
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

  const body = {
    model: modelId,
    messages,
    temperature: 0.2,
    stream: false,
    max_tokens: quick ? 256 : 1600,
  };
  const attempts = [];
  for (const path of chatPaths) {
    const url = new URL(path, client.baseUrl).toString();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      const text = await response.text();
      attempts.push({ url, ok: response.ok, status: response.status });
      if (!response.ok) continue;
      return {
        generatedAt: new Date().toISOString(),
        action,
        baseUrl: client.baseUrl,
        model: modelId,
        content: extractAssistantText(text),
        attempts,
      };
    } catch (error) {
      attempts.push({ url, ok: false, error: String(error) });
    }
  }
  throw new Error(`Lemonade chat completion failed: ${JSON.stringify(attempts)}`);
}
