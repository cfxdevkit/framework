import 'server-only';

import { join } from 'node:path';
import { createClient, http, type Signer } from '@cfxdevkit/core';
import {
  ContractRegistry,
  createDevnodeServerApp,
  DevnodeServerController,
  type DevnodeServerStatus,
  KeystoreService,
  NetworkState,
} from '@cfxdevkit/devnode-server';
import type { DevnodeMiningStatus, DevnodeStatusResponse, DevnodeUrls } from './devnode-types';
import type { KeystoreActiveWalletSummary } from './keystore-types';
import {
  mapDevnodeStatus,
  normalizeRuntimeNetwork,
  normalizeRuntimeSpace,
  type RuntimeNetworkId,
  type RuntimeSpaceId,
  resolveRuntimeChain,
} from './local-runtime-helpers';

const keystorePath =
  process.env.LOCAL_KEYSTORE_PATH ?? join(process.cwd(), '.local-data', 'keystore.json');
const nodeProfileDataRoot = join(process.cwd(), '.local-data', 'node-profiles');
type RuntimeExtensionApp = {
  get: (
    path: string,
    handler: (context: {
      json: (body: unknown, status?: number) => Response;
      req: { query: (key: string) => string | undefined };
    }) => Promise<Response> | Response,
  ) => unknown;
};
type RuntimeExtensionContext = { controller: DevnodeServerController };

export const runtimeController = new DevnodeServerController();
export const runtimeKeystore = new KeystoreService(keystorePath);
export const runtimeContracts = new ContractRegistry();
export const runtimeNetwork = new NetworkState();

const runtimeApp = createDevnodeServerApp({
  contracts: runtimeContracts,
  controller: runtimeController,
  extendApp: (app: RuntimeExtensionApp, services: RuntimeExtensionContext) => {
    app.get('/custom/block-number', async (context) => {
      const network = normalizeRuntimeNetwork(context.req.query('network'));
      const space = normalizeRuntimeSpace(context.req.query('space'));

      if (!network) {
        return context.json(
          { ok: false, error: 'network must be local, testnet, or mainnet' },
          400,
        );
      }

      if (!space) {
        return context.json({ ok: false, error: 'space must be core or espace' }, 400);
      }

      try {
        return context.json(await readShowcaseBlockNumber(network, space, services.controller));
      } catch (error) {
        return context.json(
          { ok: false, error: error instanceof Error ? error.message : String(error) },
          400,
        );
      }
    });
  },
  keystore: runtimeKeystore,
  network: runtimeNetwork,
  nodeProfileDataRoot,
} as unknown as Parameters<typeof createDevnodeServerApp>[0]);

const jsonHeaders = { 'Cache-Control': 'no-store' } as const;

type RuntimeKeystoreApi = KeystoreService & {
  activeSigner: () => Promise<Signer>;
  activeWallet: () => Promise<KeystoreActiveWalletSummary | null>;
};

export interface ShowcaseBlockNumberResponse {
  chainId: number;
  family: 'core' | 'espace';
  head: string;
  network: RuntimeNetworkId;
  ok: true;
  rpcUrl: string;
  space: RuntimeSpaceId;
}

const runtimeKeystoreApi = runtimeKeystore as unknown as RuntimeKeystoreApi;

export function noStoreHeaders() {
  return jsonHeaders;
}

export async function readRuntimeActiveWallet(): Promise<KeystoreActiveWalletSummary | null> {
  return runtimeKeystoreApi.activeWallet();
}

export async function readRuntimeActiveSigner(): Promise<Signer> {
  return runtimeKeystoreApi.activeSigner();
}

export async function readShowcaseBlockNumber(
  network: RuntimeNetworkId,
  space: RuntimeSpaceId,
  controller: DevnodeServerController = runtimeController,
): Promise<ShowcaseBlockNumberResponse> {
  const { chain, rpcUrl } = resolveRuntimeChain(network, space, controller);
  const client = createClient({
    chain,
    transport: http({ timeoutMs: 15_000, ...(rpcUrl ? { url: rpcUrl } : {}) }),
  });
  const head =
    client.family === 'core' ? await client.getEpochNumber() : await client.getBlockNumber();

  return {
    chainId: chain.id,
    family: client.family,
    head: head.toString(),
    network,
    ok: true,
    rpcUrl,
    space,
  };
}

export async function requestRuntime(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }

  return runtimeApp.request(path, {
    ...init,
    headers,
  });
}

export async function readRuntimeJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function getShowcaseDevnodeStatus(error?: string): Promise<DevnodeStatusResponse> {
  const response = await requestRuntime('/node/status', { method: 'GET' });
  const payload = await readRuntimeJson<{ node: DevnodeServerStatus; ok: boolean }>(response);
  return mapDevnodeStatus(payload.node, error);
}

export async function runShowcaseDevnodeAction(
  path: '/node/start' | '/node/stop' | '/node/restart' | '/node/mine',
  body?: unknown,
): Promise<{ body: DevnodeStatusResponse; status: number }> {
  const response = await requestRuntime(path, {
    ...(body === undefined
      ? { method: 'POST' }
      : {
          body: JSON.stringify(body),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        }),
  });

  if (!response.ok) {
    const payload = await readRuntimeJson<{ error?: string }>(response).catch(
      () => null as { error?: string } | null,
    );
    const message = payload?.error ?? `Runtime request failed (${response.status})`;
    const snapshot = await getShowcaseDevnodeStatus(message);
    return {
      body: { ...snapshot, error: message },
      status: response.status,
    };
  }

  const payload = await readRuntimeJson<{ node: DevnodeServerStatus; ok: boolean }>(response);
  return {
    body: await mapDevnodeStatus(payload.node),
    status: response.status,
  };
}
