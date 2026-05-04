// @ts-nocheck
import { spawn } from 'node:child_process';
import { root } from '../shared/index.ts';
import { assistantMessageText } from './complete-utils.ts';
import { writePiLemonadeProviderExtension } from './pi.ts';

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
