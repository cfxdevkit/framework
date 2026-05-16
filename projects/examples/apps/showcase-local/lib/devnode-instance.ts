import 'server-only';

import { createDevNode, type DevNode } from '@cfxdevkit/devnode';
import type { DevnodeMiningStatus, DevnodeStatusResponse, DevnodeUrls } from './devnode-types';

let devNode: DevNode | null = null;
let lastError: string | null = null;

export function getInstance(): DevNode | null {
  return devNode;
}

export function getOrCreate(): DevNode {
  if (!devNode) {
    devNode = createDevNode({ logging: false, miningIntervalMs: 0 });
  }
  return devNode;
}

export function clearDevnodeError(): void {
  lastError = null;
}

export function rememberDevnodeError(message: string): void {
  lastError = message;
}

export function normalizeDevnodeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes('@xcfx/node') &&
    (normalized.includes('cannot find') || normalized.includes('not found'))
  ) {
    return 'The local devnode runtime is not available. Ensure @xcfx/node is installed and its native binary can run in this environment.';
  }

  return message;
}

export async function getDevnodeStatus(): Promise<DevnodeStatusResponse> {
  const node = getInstance();

  if (!node) {
    return lastError
      ? { error: lastError, running: false, status: 'error' }
      : { running: false, status: 'stopped' };
  }

  const status = node.getStatus();
  const running = node.isRunning();
  const response: DevnodeStatusResponse = {
    running,
    status,
  };

  const mining = toMiningStatus(node);
  if (mining) {
    response.mining = mining;
  }

  const urls = toUrls(node);
  if (urls && running) {
    response.urls = urls;
    response.rpcUrl = urls.espace;
    const blockNumber = await readBlockNumber(urls.espace);
    if (blockNumber !== null) {
      response.blockNumber = blockNumber;
    }
  }

  if (lastError) {
    response.error = lastError;
    if (!running) {
      response.status = 'error';
    }
  }

  return response;
}

function toUrls(node: DevNode): DevnodeUrls | undefined {
  try {
    return node.urls;
  } catch {
    return undefined;
  }
}

function toMiningStatus(node: DevNode): DevnodeMiningStatus | undefined {
  const mining = node.getMiningStatus();
  return {
    enabled: mining.enabled,
    intervalMs: mining.intervalMs,
    ticks: mining.ticks,
    ...(mining.startedAt ? { startedAt: mining.startedAt.toISOString() } : {}),
  };
}

async function readBlockNumber(rpcUrl: string): Promise<number | null> {
  try {
    const response = await fetch(rpcUrl, {
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
      }),
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { result?: unknown };
    if (typeof payload.result !== 'string') {
      return null;
    }

    return Number.parseInt(payload.result, 16);
  } catch {
    return null;
  }
}
