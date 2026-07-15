/**
 * Wiki generation via llm-agents provider routing.
 *
 * Uses resolveActionConfig() as the single source of truth for action → provider routing.
 */
import { spawn } from 'node:child_process';
import { syncWikiContent } from '@cfxdevkit/docs-pipeline';
import { readConfig } from '../completion/config.js';
import { resolveActionConfig } from '../completion/resolve-action.js';
import { root } from '../shared/index.js';
import { logInfo, logStep } from '../shared/logging.js';
import { parseDocFlags } from './flags.js';

export async function runWikiGenerate(args: string[]): Promise<void> {
  if (args[0] === '--') args.shift();
  const flags = parseDocFlags(args);
  const total = 2;

  logStep(1, total, 'Resolving LLM provider config');
  const config = await readConfig();
  const resolved = resolveActionConfig('wiki-generate', config);

  // gitnexus builds the chat URL as: baseUrl.trimEnd('/') + '/chat/completions'
  // Lemonade listens at /api/v1/chat/completions — append /api/v1 when no path prefix.
  // Cloud providers (GitHub Copilot, OpenAI-compat) use the root endpoint directly.
  let gitnexusBase: string;
  if (resolved.isCloud) {
    gitnexusBase = resolved.baseUrl.replace(/\/+$/, '');
  } else {
    const parsedBase = new URL(
      resolved.baseUrl.endsWith('/') ? resolved.baseUrl : `${resolved.baseUrl}/`,
    );
    const hasPathPrefix = parsedBase.pathname !== '/';
    gitnexusBase = hasPathPrefix
      ? resolved.baseUrl
      : `${resolved.baseUrl.replace(/\/+$/, '')}/api/v1`;
  }

  logInfo(
    `  provider: ${resolved.provider}${resolved.profileName ? ` (profile: ${resolved.profileName})` : ''}`,
  );
  logInfo(`  baseUrl : ${gitnexusBase}`);
  logInfo(`  model   : ${resolved.model}`);

  await new Promise<void>((resolve, reject) => {
    // Models that put output in reasoning_content require --reasoning-model flag
    const REASONING_MODEL_PATTERNS = ['122B', '32B-thinking', 'o1', 'o3', 'o4'];
    const isReasoningModel = REASONING_MODEL_PATTERNS.some((p) => resolved.model.includes(p));

    const gitnexusArgs = [
      'exec',
      'gitnexus',
      'wiki',
      '--base-url',
      gitnexusBase,
      '--model',
      resolved.model,
      '--api-key',
      resolved.apiKey,
      '--force',
      '--concurrency',
      '1',
    ];
    if (isReasoningModel) gitnexusArgs.push('--reasoning-model');
    if (flags.quick) gitnexusArgs.push('--quick');

    const child = spawn('pnpm', gitnexusArgs, {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`gitnexus wiki terminated with signal ${signal}`));
        return;
      }
      if ((code ?? 1) !== 0) {
        reject(new Error(`gitnexus wiki exited with code ${code ?? 1}`));
        return;
      }
      resolve();
    });
  });

  logStep(2, total, 'Syncing wiki pages into content/wiki/');
  const synced = await syncWikiContent();
  logInfo(`  synced ${synced} wiki pages`);
}
