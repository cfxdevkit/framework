// @ts-nocheck
import { spawn } from 'node:child_process';
import {
  chooseModel,
  createClient,
  discoverModels,
  extractAssistantText,
  formatFetchError,
  readConfig,
} from './lemonade-client.ts';
import { assistantMessageText } from './lemonade-complete-utils.ts';
import { writePiLemonadeProviderExtension } from './lemonade-pi.ts';
import { chatPaths, root } from './lemonade-shared.ts';

export async function completeCommitAgent({ action, flags, systemPrompt, userPrompt, maxTokens }) {
  if (flags.agent === 'pi-rpc') {
    return completeWithPiRpc({ action, flags, systemPrompt, userPrompt });
  }
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
  if (flags.agent === 'pi-rpc') {
    return completeWithPiRpc({ action, flags, systemPrompt, userPrompt });
  }
  return completeDirect({
    action,
    modelOverride: flags.model,
    systemPrompt,
    userPrompt,
    maxTokens,
  });
}
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
        signal: AbortSignal.timeout(120000),
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
export async function completeWithPiRpc({ action, flags, systemPrompt, userPrompt }) {
  const piArgs = ['--mode', 'json', '--print', '--no-session', '--no-tools'];
  const piProvider = flags.piProvider ?? 'lemonade';
  let piModel = flags.piModel ?? flags.model;
  if (piProvider === 'lemonade') {
    const lemonadeProvider = await writePiLemonadeProviderExtension(piModel);
    piArgs.push('--extension', lemonadeProvider.extensionPath, '--provider', 'lemonade');
    piModel = lemonadeProvider.modelId;
  } else {
    piArgs.push('--provider', piProvider);
  }
  if (piModel) piArgs.push('--model', piModel);

  const prompt = [
    systemPrompt,
    '',
    'Important: return only the requested strict JSON object. Do not edit files or run commands.',
    '',
    userPrompt,
  ].join('\n');
  piArgs.push(prompt);

  return new Promise((resolve, reject) => {
    const child = spawn('pi', piArgs, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Pi RPC completion timed out'));
    }, 180000);
    let buffer = '';
    let stderr = '';
    let lastAssistantText = '';
    let settled = false;

    function settle(error, response) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(response);
    }

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      while (true) {
        const newlineIndex = buffer.indexOf('\n');
        if (newlineIndex === -1) break;
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);
        if (!line.trim()) continue;
        let event = null;
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }
        if (event.type === 'message_end' && event.message?.role === 'assistant') {
          lastAssistantText = assistantMessageText(event.message);
        }
        if (event.type === 'agent_end') {
          const finalMessage = [...(event.messages ?? [])]
            .reverse()
            .find((message) => message.role === 'assistant');
          const content = assistantMessageText(finalMessage) || lastAssistantText;
          settle(null, {
            generatedAt: new Date().toISOString(),
            action,
            baseUrl: 'pi-rpc',
            model: piModel ?? 'pi-default',
            content: content.trim(),
            attempts: [{ url: 'pi --mode json --print', ok: true, status: 0 }],
          });
        }
      }
    });

    child.on('error', (error) => {
      settle(
        new Error(
          `Unable to start pi. Install it with: pnpm add -g @mariozechner/pi-coding-agent. ${error.message}`,
        ),
      );
    });
    child.on('exit', (code) => {
      if (!settled && code !== 0) settle(new Error(`Pi RPC exited ${code}: ${stderr.trim()}`));
    });
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
        signal: AbortSignal.timeout(120000),
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
