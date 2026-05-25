import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import type { ToolingNamespaceDefinition } from './contracts.js';

const DEFAULT_PORT = 52000;
const DEFAULT_HOST = '127.0.0.1';

export const devnodeToolingNamespace: ToolingNamespaceDefinition = {
  name: 'devnode',
  description: 'Manage the local Conflux devnode-server control plane',
  commands: [
    {
      name: 'start',
      description: 'Start the devnode-server control plane',
      usage: 'start [--port <n>] [--host <h>] [--keystore-path <path>]',
    },
    {
      name: 'stop',
      description: 'Stop the devnode-server control plane',
      usage: 'stop [--base-url <url>]',
    },
    {
      name: 'status',
      description: 'Print devnode-server status',
      usage: 'status [--base-url <url>] [--json]',
    },
  ],
  run: runDevnodeCommand,
};

async function runDevnodeCommand(args: readonly string[]): Promise<void> {
  const [sub, ...rest] = args;
  switch (sub) {
    case 'start':
      return runDevnodeStart(rest);
    case 'stop':
      return runDevnodeStop(rest);
    case 'status':
      return runDevnodeStatus(rest);
    default:
      process.stdout.write(
        'Usage: cdk devnode <start|stop|status>\n\n' +
          '  start   --port <n>        Start the devnode-server (default port 52000)\n' +
          '  stop    --base-url <url>  Stop a running devnode-server\n' +
          '  status  --base-url <url>  Print node + keystore status\n',
      );
  }
}

function resolveServerBin(): string {
  const require = createRequire(import.meta.url);
  return require.resolve('@cfxdevkit/devnode-server/dist/cli.js');
}

async function runDevnodeStart(args: readonly string[]): Promise<void> {
  let port = DEFAULT_PORT;
  let host = DEFAULT_HOST;
  let keystorePath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) port = Number(args[++i]);
    else if (args[i] === '--host' && args[i + 1]) host = args[++i] as string;
    else if (args[i] === '--keystore-path' && args[i + 1]) keystorePath = args[++i];
  }

  const bin = resolveServerBin();
  const spawnArgs = [bin, 'serve', '--host', host, '--port', String(port)];
  if (keystorePath) spawnArgs.push('--keystore-path', keystorePath);

  const child = spawn(process.execPath, spawnArgs, { stdio: 'inherit', detached: true });
  child.unref();

  // Wait for ready
  const baseUrl = `http://${host}:${port}`;
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) {
        process.stdout.write(`devnode-server running at ${baseUrl}\n`);
        return;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  process.stderr.write(`devnode-server did not become ready at ${baseUrl} within 15 s\n`);
  process.exit(1);
}

async function runDevnodeStop(args: readonly string[]): Promise<void> {
  const baseUrl = getBaseUrl(args);
  try {
    const res = await fetch(`${baseUrl}/node/stop`, { method: 'POST' });
    const body = (await res.json()) as { ok?: boolean };
    process.stdout.write(body.ok ? 'Node stopped.\n' : `Stop failed: ${JSON.stringify(body)}\n`);
  } catch (err) {
    process.stderr.write(`Could not reach devnode-server at ${baseUrl}: ${err}\n`);
    process.exit(1);
  }
}

async function runDevnodeStatus(args: readonly string[]): Promise<void> {
  const json = args.includes('--json');
  const baseUrl = getBaseUrl(args);
  try {
    const [health, node] = await Promise.all([
      fetch(`${baseUrl}/health`).then((r) => r.json()),
      fetch(`${baseUrl}/node/status`).then((r) => r.json()),
    ]);
    const result = { health, node };
    if (json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      const running = (node as { node?: { running?: boolean } }).node?.running ?? false;
      process.stdout.write(
        `devnode-server: ${(health as { ok?: boolean }).ok ? 'up' : 'unreachable'}\n`,
      );
      process.stdout.write(`node: ${running ? 'running' : 'stopped'}\n`);
    }
  } catch {
    process.stderr.write(`devnode-server not reachable at ${baseUrl}\n`);
    process.exit(1);
  }
}

function getBaseUrl(args: readonly string[]): string {
  const idx = args.indexOf('--base-url');
  if (idx !== -1 && args[idx + 1]) return args[idx + 1] as string;
  return (
    process.env.CFXDEVKIT_DEVNODE_SERVER_URL?.trim() ?? `http://${DEFAULT_HOST}:${DEFAULT_PORT}`
  );
}
