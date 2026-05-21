import { chatPaths } from '../shared/index.ts';
import {
  chooseModel,
  createClient,
  discoverModels,
  extractAssistantText,
  formatFetchError,
  readConfig,
  resolveRequestTimeoutMs,
} from './client.ts';

export async function completeDirect({
  action,
  modelOverride,
  systemPrompt,
  userPrompt,
  maxTokens,
}) {
  const config = await readConfig();
  const client = await createClient(config);
  const models = await discoverModels(client.baseUrls);
  const modelId =
    modelOverride ?? config.actions?.[action] ?? config.defaultModel ?? chooseModel(models)?.id;
  if (!modelId)
    throw new Error('No Lemonade model available. Run pnpm run llm:models to inspect inventory.');
  const requestTimeoutMs = resolveRequestTimeoutMs(config);

  const body = {
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1,
    stream: false,
    max_tokens: maxTokens,
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
      attempts.push({ url, ok: false, error: formatFetchError(error) });
    }
  }
  throw new Error(`Lemonade completion failed: ${JSON.stringify(attempts)}`);
}
