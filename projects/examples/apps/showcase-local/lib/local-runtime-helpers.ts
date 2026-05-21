import {
  coreSpaceLocal,
  coreSpaceMainnet,
  coreSpaceTestnet,
  espaceLocal,
  espaceMainnet,
  espaceTestnet,
} from '@cfxdevkit/cdk';
import type { DevnodeServerController, DevnodeServerStatus } from '@cfxdevkit/devnode-server';
import type { DevnodeMiningStatus, DevnodeStatusResponse, DevnodeUrls } from './devnode-types';

export type RuntimeNetworkId = 'local' | 'mainnet' | 'testnet';
export type RuntimeSpaceId = 'core' | 'espace';

export async function mapDevnodeStatus(
  node: DevnodeServerStatus,
  error?: string,
): Promise<DevnodeStatusResponse> {
  const response: DevnodeStatusResponse = {
    running: node.running,
    status: node.running ? node.status : error ? 'error' : node.status,
  };

  if (node.mining) {
    response.mining = toMiningStatus(node.mining);
  }

  if (node.urls && node.running) {
    response.urls = toUrls(node.urls);
    response.rpcUrl = node.urls.espace;
    const blockNumber = await readBlockNumber(node.urls.espace);
    if (blockNumber !== null) {
      response.blockNumber = blockNumber;
    }
  }

  if (error) {
    response.error = error;
  }

  return response;
}

export function resolveRuntimeChain(
  network: RuntimeNetworkId,
  space: RuntimeSpaceId,
  controller: DevnodeServerController,
) {
  if (network === 'local') {
    const status = controller.status();
    const rpcUrl = space === 'core' ? status.urls?.core : status.urls?.espace;
    if (!status.running || !rpcUrl) {
      throw new Error('Local devnode is not running');
    }

    return {
      chain: space === 'core' ? coreSpaceLocal : espaceLocal,
      rpcUrl,
    };
  }

  if (network === 'testnet') {
    const chain = space === 'core' ? coreSpaceTestnet : espaceTestnet;
    return { chain, rpcUrl: chain.rpc.http[0] ?? '' };
  }

  const chain = space === 'core' ? coreSpaceMainnet : espaceMainnet;
  return { chain, rpcUrl: chain.rpc.http[0] ?? '' };
}

export function normalizeRuntimeNetwork(value: string | undefined): RuntimeNetworkId | null {
  if (value === 'local' || value === 'testnet' || value === 'mainnet') {
    return value;
  }

  return null;
}

export function normalizeRuntimeSpace(value: string | undefined): RuntimeSpaceId | null {
  if (value === 'core' || value === 'espace') {
    return value;
  }

  return null;
}

function toUrls(urls: DevnodeServerStatus['urls']): DevnodeUrls {
  return {
    core: urls?.core ?? '',
    espace: urls?.espace ?? '',
    coreWs: urls?.coreWs ?? '',
    espaceWs: urls?.espaceWs ?? '',
  };
}

function toMiningStatus(mining: NonNullable<DevnodeServerStatus['mining']>): DevnodeMiningStatus {
  const startedAt =
    typeof mining.startedAt === 'string'
      ? mining.startedAt
      : mining.startedAt instanceof Date
        ? mining.startedAt.toISOString()
        : undefined;

  return {
    enabled: mining.enabled,
    intervalMs: mining.intervalMs,
    ticks: mining.ticks,
    ...(startedAt ? { startedAt } : {}),
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
