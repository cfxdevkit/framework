// @ts-nocheck
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { chooseModel, createClient, discoverModels, readConfig } from './lemonade-client.ts';
import { artifactsRoot } from './lemonade-shared.ts';

export async function writePiLemonadeProviderExtension(preferredModel) {
  const config = await readConfig();
  const client = await createClient(config);
  const models = await discoverModels(client.baseUrls);
  const chosen = chooseModel(models, preferredModel ?? config.defaultModel);
  if (!chosen?.id) {
    throw new Error('No Lemonade model available for Pi provider registration.');
  }
  const providerBaseUrl = new URL('/api/v1', client.baseUrl).toString();
  const extensionPath = join(artifactsRoot, 'config', 'pi-lemonade-provider.mjs');
  const providerModels = models.map((model) => ({
    id: model.id ?? model.checkpoint,
    name: model.id ?? model.checkpoint,
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 4096,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    compat: {
      supportsDeveloperRole: false,
      supportsReasoningEffort: false,
      supportsUsageInStreaming: false,
      maxTokensField: 'max_tokens',
    },
  }));
  const source = [
    'export default function registerLemonadeProvider(pi) {',
    `  pi.registerProvider('lemonade', ${JSON.stringify(
      {
        name: 'Lemonade Server',
        baseUrl: providerBaseUrl,
        apiKey: 'lemonade',
        api: 'openai-completions',
        models: providerModels,
      },
      null,
      2,
    )});`,
    '}',
    '',
  ].join('\n');
  await mkdir(dirname(extensionPath), { recursive: true });
  await writeFile(extensionPath, source, 'utf8');
  return { extensionPath, modelId: chosen.id };
}
