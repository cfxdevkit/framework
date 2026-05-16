#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import type { DevNodeConfig } from '@cfxdevkit/devnode';
import { serve } from '@hono/node-server';
import { createDevnodeServerApp } from './app.js';
import {
  formatBaseUrl,
  parseInteger,
  renderCliResult,
  renderHelp,
  requestJson,
  type StatusSnapshot,
} from './cli-helpers.js';

export const DEFAULT_HOST = '127.0.0.1';
export const DEFAULT_PORT = 52000;
export const DEFAULT_BASE_URL = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;

export type ParsedArgs =
  | { command: 'help' }
  | { command: 'serve'; host: string; port: number; keystorePath?: string }
  | { command: 'status'; baseUrl: string; json: boolean }
  | { command: 'start'; baseUrl: string; json: boolean; config: DevNodeConfig }
  | { command: 'stop'; baseUrl: string; json: boolean }
  | { command: 'restart'; baseUrl: string; json: boolean; config?: DevNodeConfig }
  | { command: 'wipe'; baseUrl: string; json: boolean; restart: boolean; config?: DevNodeConfig }
  | { command: 'mine'; baseUrl: string; json: boolean; blocks?: number; pack: boolean };

interface ExecuteOptions {
  fetchImpl?: typeof fetch;
}
export function parseArgs(argv: string[]): ParsedArgs {
  const first = argv[0];
  if (!first || first === '-h' || first === '--help') return { command: 'help' };

  const knownCommands = new Set([
    'help',
    'serve',
    'status',
    'start',
    'stop',
    'restart',
    'wipe',
    'mine',
  ]);
  const command = knownCommands.has(first) ? first : 'serve';
  const args = command === 'serve' && !knownCommands.has(first) ? argv : argv.slice(1);

  if (command === 'help') return { command: 'help' };

  let host = DEFAULT_HOST;
  let port = DEFAULT_PORT;
  let baseUrl = DEFAULT_BASE_URL;
  let keystorePath: string | undefined;
  let json = false;
  let restart = false;
  let pack = false;
  let blocks: number | undefined;
  const config: DevNodeConfig = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = (): string => {
      const value = args[index + 1];
      if (value === undefined) throw new Error(`missing value for ${arg}`);
      index += 1;
      return value;
    };

    switch (arg) {
      case '-h':
      case '--help':
        return { command: 'help' };
      case '--host':
        host = next();
        break;
      case '--port':
        port = parseInteger(next(), '--port', 1);
        break;
      case '--base-url':
        baseUrl = next();
        break;
      case '--keystore-path':
        keystorePath = next();
        break;
      case '--json':
        json = true;
        break;
      case '--restart':
        restart = true;
        break;
      case '--pack':
        pack = true;
        break;
      case '--blocks':
        blocks = parseInteger(next(), '--blocks', 1);
        break;
      case '--accounts':
        config.accounts = parseInteger(next(), '--accounts', 1);
        break;
      case '--data-dir':
        config.dataDir = next();
        break;
      case '--mnemonic':
        config.mnemonic = next();
        break;
      case '--mining-interval':
        config.miningIntervalMs = parseInteger(next(), '--mining-interval', 0);
        break;
      case '--logging':
        config.logging = true;
        break;
      default:
        throw new Error(`unknown argument: ${arg}`);
    }
  }

  switch (command) {
    case 'serve':
      return keystorePath
        ? { command: 'serve', host, port, keystorePath }
        : { command: 'serve', host, port };
    case 'status':
      return { command: 'status', baseUrl, json };
    case 'start':
      return { command: 'start', baseUrl, json, config };
    case 'stop':
      return { command: 'stop', baseUrl, json };
    case 'restart':
      return Object.keys(config).length > 0
        ? { command: 'restart', baseUrl, json, config }
        : { command: 'restart', baseUrl, json };
    case 'wipe':
      return Object.keys(config).length > 0
        ? { command: 'wipe', baseUrl, json, restart, config }
        : { command: 'wipe', baseUrl, json, restart };
    case 'mine':
      return blocks !== undefined
        ? { command: 'mine', baseUrl, json, blocks, pack }
        : { command: 'mine', baseUrl, json, pack };
    default:
      throw new Error(`unsupported command: ${command}`);
  }
}

export function printHelp(): string {
  return renderHelp({ baseUrl: DEFAULT_BASE_URL, host: DEFAULT_HOST, port: DEFAULT_PORT });
}

export async function executeCliCommand(
  parsed: Exclude<ParsedArgs, { command: 'help' } | { command: 'serve' }>,
  options: ExecuteOptions = {},
): Promise<StatusSnapshot | unknown> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  switch (parsed.command) {
    case 'status': {
      const [health, node, keystore] = await Promise.all([
        requestJson(fetchImpl, parsed.baseUrl, '/health', 'GET'),
        requestJson(fetchImpl, parsed.baseUrl, '/node/status', 'GET'),
        requestJson(fetchImpl, parsed.baseUrl, '/keystore/status', 'GET'),
      ]);

      const healthRecord = health && typeof health === 'object' ? (health as { ok?: unknown }) : {};
      return {
        health: { ok: healthRecord.ok === true },
        node,
        keystore,
      } satisfies StatusSnapshot;
    }
    case 'start':
      return requestJson(fetchImpl, parsed.baseUrl, '/node/start', 'POST', {
        config: parsed.config,
      });
    case 'stop':
      return requestJson(fetchImpl, parsed.baseUrl, '/node/stop', 'POST');
    case 'restart':
      return requestJson(
        fetchImpl,
        parsed.baseUrl,
        '/node/restart',
        'POST',
        parsed.config ? { config: parsed.config } : undefined,
      );
    case 'wipe':
      return requestJson(fetchImpl, parsed.baseUrl, '/node/wipe', 'POST', {
        restart: parsed.restart,
        ...(parsed.config ? { config: parsed.config } : {}),
      });
    case 'mine':
      return requestJson(fetchImpl, parsed.baseUrl, '/node/mine', 'POST', {
        ...(parsed.pack ? { pack: true } : {}),
        ...(parsed.blocks !== undefined ? { blocks: parsed.blocks } : {}),
      });
  }
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`error: ${error instanceof Error ? error.message : String(error)}\n\n`);
    process.stderr.write(printHelp());
    process.exit(2);
  }

  if (parsed.command === 'help') {
    process.stdout.write(printHelp());
    return;
  }

  if (parsed.command === 'serve') {
    const app = createDevnodeServerApp(
      parsed.keystorePath ? { keystorePath: parsed.keystorePath } : {},
    );
    const server = serve({ fetch: app.fetch, hostname: parsed.host, port: parsed.port }, (info) => {
      process.stdout.write(
        `Conflux DevKit control plane listening at ${formatBaseUrl(parsed.host, info.port)}\n`,
      );
    });

    let shuttingDown = false;
    const shutdown = (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      process.stdout.write(`Received ${signal}, shutting down control plane...\n`);
      server.close(() => process.exit(0));
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    return;
  }

  try {
    const result = await executeCliCommand(parsed);
    process.stdout.write(renderCliResult(parsed.command, result, parsed.json));
  } catch (error) {
    process.stderr.write(`error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
