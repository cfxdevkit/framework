import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { configPath, defaultBaseUrls, modelPaths } from '../shared/index.ts';

export function normalizeBaseUrl(url) {
  const value = String(url || '').trim();
  if (!value) return value;
  return value.endsWith('/') ? value : `${value}/`;
}

export async function createClient(config = null) {
  const cfg = config ?? (await readConfig());
  const baseUrls = cfg.baseUrl
    ? [cfg.baseUrl]
    : process.env.LEMONADE_URL || process.env.LEMONADE_BASE_URL
      ? [process.env.LEMONADE_URL ?? process.env.LEMONADE_BASE_URL]
      : defaultBaseUrls;
  const models = await discoverModels(baseUrls);
  const attempt =
    models.find((model) => model.__baseUrl)?.__baseUrl ?? normalizeBaseUrl(baseUrls[0]);
  return { baseUrl: attempt, baseUrls };
}

export async function discoverModels(baseUrls, opts: { includeAttempts?: boolean } = {}) {
  const attempts = [];
  for (const baseUrl of baseUrls.map(normalizeBaseUrl)) {
    for (const path of modelPaths) {
      const url = new URL(path, baseUrl).toString();
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
        const text = await response.text();
        const discoveredModels = response.ok ? extractModelInventory(text) : [];
        attempts.push({
          url,
          ok: response.ok,
          status: response.status,
          modelCount: discoveredModels.length,
        });
        if (!response.ok) continue;
        const models = discoveredModels.map((model) => ({
          ...model,
          __baseUrl: baseUrl,
        }));
        if (models.length) return opts.includeAttempts ? { models, attempts } : models;
      } catch (error) {
        attempts.push({ url, ok: false, error: formatFetchError(error) });
        // try next endpoint
      }
    }
  }
  return opts.includeAttempts ? { models: [], attempts } : [];
}

export function formatFetchError(error) {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause;
  if (cause && typeof cause === 'object' && 'code' in cause)
    return `${error.message} (${cause.code})`;
  return error.message;
}

export function extractModelInventory(text) {
  try {
    const parsed = JSON.parse(text);
    const data = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : [];
    return data
      .map((model) => ({
        id: typeof model?.id === 'string' ? model.id : undefined,
        checkpoint: typeof model?.checkpoint === 'string' ? model.checkpoint : undefined,
        labels: Array.isArray(model?.labels)
          ? model.labels.filter((label) => typeof label === 'string')
          : [],
        recipe: typeof model?.recipe === 'string' ? model.recipe : undefined,
        size: typeof model?.size === 'number' ? model.size : undefined,
        suggested: model?.suggested === true,
      }))
      .filter((model) => model.id || model.checkpoint);
  } catch {
    return [];
  }
}

export function chooseModel(models, preferredId = null) {
  if (preferredId) {
    const preferred = models.find(
      (model) => model.id === preferredId || model.checkpoint === preferredId,
    );
    if (preferred) return preferred;
  }
  return [...models].sort((left, right) => modelScore(right) - modelScore(left))[0];
}

export function modelScore(model) {
  const text =
    `${model.id ?? ''} ${model.checkpoint ?? ''} ${(model.labels ?? []).join(' ')}`.toLowerCase();
  let score = 0;
  if (model.suggested) score += 10;
  if (text.includes('coder')) score += 8;
  if (text.includes('coding')) score += 6;
  if (text.includes('tool')) score += 4;
  if (text.includes('qwen')) score += 3;
  if (text.includes('hot')) score += 2;
  return score;
}

export function extractAssistantText(text) {
  const parsed = JSON.parse(text);
  const message =
    parsed?.choices?.[0]?.message?.content ?? parsed?.choices?.[0]?.text ?? parsed?.message;
  if (typeof message !== 'string') return text;
  return message.trim();
}

export async function readConfig() {
  try {
    return { ...defaultConfig(), ...JSON.parse(await readFile(configPath, 'utf8')) };
  } catch (error) {
    if (error?.code === 'ENOENT') return defaultConfig();
    throw error;
  }
}

export async function writeConfig(config) {
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

export function defaultConfig() {
  return { baseUrl: null, defaultModel: null, actions: {} };
}
