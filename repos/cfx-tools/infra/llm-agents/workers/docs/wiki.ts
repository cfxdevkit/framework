/**
 * Wiki generation via llm-agents provider routing.
 *
 * Replaces the old wiki-update.ts which read hardcoded config paths.
 * Resolves the LLM provider config through the standard llm-agents config loader
 * and passes the resolved baseUrl + model to `gitnexus wiki`.
 */
import { spawn } from 'node:child_process';
import { syncWikiContent } from '@cfxdevkit/docs-pipeline';
import { readConfig } from '../completion/config.ts';
import { root } from '../shared/index.ts';
import { logInfo, logStep } from '../shared/logging.ts';
import { parseDocFlags } from './flags.ts';

export async function runWikiGenerate(args: string[]): Promise<void> {
  if (args[0] === '--') args.shift();
  const flags = parseDocFlags(args);
  const total = 2;

  logStep(1, total, 'Resolving LLM provider config');
  const config = await readConfig();
  const rawBase = config.baseUrl ?? 'http://host.containers.internal:13305/';
  // Use action-specific model if configured, fall back to defaultModel
  // wiki-generate uses Qwen3-Coder-30B by default — Qwen3.5-122B forces thinking mode
  // which gitnexus cannot read (it only reads .content, not .reasoning_content)
  const model = config.actions?.['wiki-generate'] ?? config.defaultModel ?? 'Qwen3-Coder-Next-GGUF';

  // gitnexus builds the chat URL as: baseUrl.trimEnd('/') + '/chat/completions'
  // Lemonade listens at /api/v1/chat/completions, so we must include the /api/v1 path.
  // If the configured baseUrl doesn't already include a non-root path, append /api/v1.
  const parsedBase = new URL(rawBase.endsWith('/') ? rawBase : `${rawBase}/`);
  const hasPathPrefix = parsedBase.pathname !== '/';
  const gitnexusBase = hasPathPrefix ? rawBase : `${rawBase.replace(/\/+$/, '')}/api/v1`;

  logInfo(`  baseUrl : ${gitnexusBase}`);
  logInfo(`  model   : ${model}`);

  await new Promise<void>((resolve, reject) => {
    const gitnexusArgs = [
      'exec',
      'gitnexus',
      'wiki',
      '--base-url',
      gitnexusBase,
      '--model',
      model,
      '--api-key',
      'local',
      '--force',
      '--concurrency',
      '1',
    ];
    if (flags.quick) gitnexusArgs.push('--quick');
    // pass any unknown extra args through
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
