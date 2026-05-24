import fs from 'node:fs/promises';
import path from 'node:path';

import { runWorkspacePnpm } from './llm/process.js';
import { syncWiki } from './wiki-sync.js';
import { findRepoRoot } from './workspace.js';

type LemonadeConfig = {
  baseUrl?: string;
  defaultModel?: string;
};

type WikiUpdateOptions = {
  args?: readonly string[];
};

async function readLlmConfig(configPaths: readonly string[]) {
  for (const configPath of configPaths) {
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
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error;
    }
  }
  console.log(`  No LLM config at ${configPaths.join(' or ')} — using defaults.`);
  return {
    baseUrl: 'http://host.containers.internal:13305/api/v1/',
    model: 'Qwen3-Coder-Next-GGUF',
  };
}

export async function updateWiki(options: WikiUpdateOptions = {}): Promise<void> {
  const repoRoot = findRepoRoot();
  const configPaths = [
    path.join(repoRoot, 'artifacts/llm/config/llm.json'),
    path.join(repoRoot, 'artifacts/llm/config/lemonade.json'),
  ] as const;
  const { baseUrl, model } = await readLlmConfig(configPaths);
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
