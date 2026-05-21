import fs from 'node:fs/promises';
import path from 'node:path';

import { runWorkspacePnpm } from './llm/process.js';
import { findRepoRoot } from './workspace.js';
import { syncWiki } from './wiki-sync.js';

type LemonadeConfig = {
  baseUrl?: string;
  defaultModel?: string;
};

type WikiUpdateOptions = {
  args?: readonly string[];
};

async function readLemonadeConfig(configPath: string) {
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(raw) as LemonadeConfig;
    const baseUrl = config.baseUrl
      ? config.baseUrl.endsWith('/')
        ? config.baseUrl
        : `${config.baseUrl}/`
      : 'http://host.containers.internal:13305/api/v1/';
    const model = config.defaultModel ?? 'Qwen3-Coder-Next-GGUF';
    return { baseUrl, model };
  } catch {
    console.log(`  No Lemonade config at ${configPath} — using defaults.`);
    return {
      baseUrl: 'http://host.containers.internal:13305/api/v1/',
      model: 'Qwen3-Coder-Next-GGUF',
    };
  }
}

export async function updateWiki(options: WikiUpdateOptions = {}): Promise<void> {
  const repoRoot = findRepoRoot();
  const configPath = path.join(repoRoot, 'artifacts/llm/config/lemonade.json');
  const { baseUrl, model } = await readLemonadeConfig(configPath);
  const extraArgs = [...(options.args ?? [])];

  console.log('\n[1/2] Regenerating GitNexus wiki');
  console.log(`  Base URL : ${baseUrl}`);
  console.log(`  Model    : ${model}`);
  if (extraArgs.length > 0) console.log(`  Extra    : ${extraArgs.join(' ')}`);
  console.log();

  await runWorkspacePnpm(
    [
      'exec',
      'gitnexus',
      'wiki',
      '--base-url',
      baseUrl,
      '--model',
      model,
      '--api-key',
      'local',
      '--force',
      '--concurrency',
      '1',
      ...extraArgs,
    ],
    { repoRoot },
  );

  console.log('\n[2/2] Syncing wiki pages into content/wiki/\n');
  await syncWiki();
}
