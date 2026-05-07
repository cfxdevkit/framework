import {
  type CoreSpaceClient,
  coreSpaceLocal,
  createClient,
  type EspaceClient,
  espaceLocal,
  type Hex,
  http,
  type SignableTx,
} from '@cfxdevkit/core';
import type { Signer } from '@cfxdevkit/core/wallet';
import { type DevNodeAccountSnapshot, devNodeManager } from '../devnode/manager.js';

export type Space = 'core' | 'espace';

export interface TxDraft {
  to: string;
  value: string;
  nonce: string;
  data: string;
  gas: string;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  storageLimit: string;
  epochHeight: string;
}

export function rpcUrl(space: Space): string {
  const status = devNodeManager.status();
  const urls = status.urls;
  if (!status.running || !urls) throw new Error('Start the local node before this operation');
  return space === 'core' ? urls.core : urls.espace;
}

export function coreClient(): CoreSpaceClient {
  const url = rpcUrl('core');
  return createClient({
    chain: { ...coreSpaceLocal, rpc: { http: [url] } },
    transport: http({ url }),
  }) as CoreSpaceClient;
}

export function espaceClient(): EspaceClient {
  const url = rpcUrl('espace');
  return createClient({
    chain: { ...espaceLocal, rpc: { http: [url] } },
    transport: http({ url }),
  }) as EspaceClient;
}

export function buildTransaction(space: Space, signer: Signer, draft: TxDraft): SignableTx {
  if (space === 'core') {
    const to = draft.to.trim() || signer.account.coreAddress;
    if (!to) throw new Error('Core address is unavailable');
    return {
      family: 'core',
      coreType: 'legacy',
      chainId: 2029,
      to,
      value: parseBigInt(draft.value),
      nonce: parseNumber(draft.nonce),
      gas: parseBigInt(draft.gas),
      gasPrice: parseBigInt(draft.gasPrice),
      storageLimit: parseBigInt(draft.storageLimit),
      epochHeight: parseBigInt(draft.epochHeight),
      data: parseHex(draft.data),
    };
  }
  return {
    family: 'espace',
    chainId: 2030,
    to: (draft.to.trim() || signer.account.address) as Hex,
    value: parseBigInt(draft.value),
    nonce: parseNumber(draft.nonce),
    gas: parseBigInt(draft.gas),
    maxFeePerGas: parseBigInt(draft.maxFeePerGas),
    maxPriorityFeePerGas: parseBigInt(draft.maxPriorityFeePerGas),
    data: parseHex(draft.data),
  };
}

export async function getNativeBalance(space: Space, signer: Signer): Promise<string> {
  const address = space === 'core' ? signer.account.coreAddress : signer.account.address;
  if (!address) throw new Error('Address is unavailable');
  if (space === 'core') {
    return (await coreClient().getBalance(address)).toString();
  }
  return (await espaceClient().getBalance(address as `0x${string}`)).toString();
}

export async function broadcastRaw(space: Space, rawTx: Hex): Promise<string> {
  if (space === 'core') return coreClient().sendRawTransaction(rawTx);
  return espaceClient().sendRawTransaction(rawTx);
}

export async function fundAddress(space: Space, signer: Signer): Promise<string> {
  const snap = devNodeManager.accounts();
  if (!snap) throw new Error('Start the local node before using the faucet');
  const faucet = snap.faucet;
  const { signerFromPrivateKey } = await import('@cfxdevkit/core/wallet');
  const faucetSigner = signerFromPrivateKey(faucet.privateKey as Hex, 2029);
  const txHash = await (space === 'core'
    ? fundCore(faucet, faucetSigner, signer)
    : fundEspace(faucetSigner, signer));
  await waitForTransaction(space, txHash);
  await new Promise((resolve) => setTimeout(resolve, 500));
  await devNodeManager.mine({ pack: true });
  await devNodeManager.mine({ blocks: 1 });
  await waitForTransactionReceipt(space, txHash);
  return txHash;
}

async function fundCore(_faucet: DevNodeAccountSnapshot, faucetSigner: Signer, signer: Signer) {
  const to = signer.account.coreAddress;
  const from = faucetSigner.account.coreAddress;
  if (!to || !from) throw new Error('Core address is unavailable');
  const client = coreClient();
  const [nonce, gasPrice, epochHeight] = await Promise.all([
    client.getTransactionCount(from, { epochTag: 'latest_state' }),
    client.getGasPrice(),
    client.getEpochNumber({ epochTag: 'latest_state' }),
  ]);
  const rawTx = await faucetSigner.signTransaction({
    family: 'core',
    coreType: 'legacy',
    chainId: 2029,
    to,
    value: 1_000_000_000_000_000_000n,
    nonce,
    gas: 21000n,
    gasPrice,
    storageLimit: 0n,
    epochHeight,
    data: '0x',
  });
  return broadcastRaw('core', rawTx);
}

async function fundEspace(faucetSigner: Signer, signer: Signer) {
  const client = espaceClient();
  const nonce = await client.getTransactionCount(faucetSigner.account.address as `0x${string}`);
  const rawTx = await faucetSigner.signTransaction({
    family: 'espace',
    chainId: 2030,
    to: signer.account.address,
    value: 1_000_000_000_000_000_000n,
    nonce,
    gas: 21000n,
    maxFeePerGas: 2_000_000_000n,
    maxPriorityFeePerGas: 1_000_000_000n,
    data: '0x',
  });
  return broadcastRaw('espace', rawTx);
}

export async function rpc(url: string, method: string, params: unknown[]) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  const payload = (await response.json()) as { result?: unknown; error?: { message?: string } };
  if (payload.error) throw new Error(payload.error.message ?? `${method} failed`);
  return payload.result;
}

async function waitForTransactionReceipt(space: Space, txHash: string) {
  const client = space === 'core' ? coreClient() : espaceClient();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const receipt = await client.getTransactionReceipt(txHash as `0x${string}`);
    if (receipt) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function waitForTransaction(space: Space, txHash: string) {
  const client = space === 'core' ? coreClient() : espaceClient();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const tx = await client.getTransaction(txHash as `0x${string}`);
    if (tx) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

function parseBigInt(value: string): bigint {
  const trimmed = value.trim();
  return trimmed.startsWith('0x') ? BigInt(trimmed) : BigInt(trimmed || '0');
}

function parseNumber(value: string): number {
  return Number(parseBigInt(value));
}
function parseHex(value: string): Hex {
  return (value.trim() || '0x') as Hex;
}
