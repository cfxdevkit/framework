import type { Hex, SignableTx } from '@cfxdevkit/core';
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
  const method = space === 'core' ? 'cfx_getBalance' : 'eth_getBalance';
  const tag = space === 'core' ? 'latest_state' : 'latest';
  return BigInt((await rpc(rpcUrl(space), method, [address, tag])) as Hex).toString();
}

export async function broadcastRaw(space: Space, rawTx: Hex): Promise<string> {
  const method = space === 'core' ? 'cfx_sendRawTransaction' : 'eth_sendRawTransaction';
  return String(await rpc(rpcUrl(space), method, [rawTx]));
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
  const url = rpcUrl('core');
  const [nonceHex, gasPriceHex, epochHex] = await Promise.all([
    rpc(url, 'cfx_getNextNonce', [from, 'latest_state']),
    rpc(url, 'cfx_gasPrice', []),
    rpc(url, 'cfx_epochNumber', ['latest_state']),
  ]);
  const rawTx = await faucetSigner.signTransaction({
    family: 'core',
    coreType: 'legacy',
    chainId: 2029,
    to,
    value: 1_000_000_000_000_000_000n,
    nonce: Number(BigInt(String(nonceHex))),
    gas: 21000n,
    gasPrice: BigInt(String(gasPriceHex)),
    storageLimit: 0n,
    epochHeight: BigInt(String(epochHex)),
    data: '0x',
  });
  return broadcastRaw('core', rawTx);
}

async function fundEspace(faucetSigner: Signer, signer: Signer) {
  const url = rpcUrl('espace');
  const nonceHex = await rpc(url, 'eth_getTransactionCount', [
    faucetSigner.account.address,
    'pending',
  ]);
  const rawTx = await faucetSigner.signTransaction({
    family: 'espace',
    chainId: 2030,
    to: signer.account.address,
    value: 1_000_000_000_000_000_000n,
    nonce: Number(BigInt(String(nonceHex))),
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
  const method = space === 'core' ? 'cfx_getTransactionReceipt' : 'eth_getTransactionReceipt';
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const receipt = await rpc(rpcUrl(space), method, [txHash]);
    if (receipt) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function waitForTransaction(space: Space, txHash: string) {
  const method = space === 'core' ? 'cfx_getTransactionByHash' : 'eth_getTransactionByHash';
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const transaction = await rpc(rpcUrl(space), method, [txHash]);
    if (transaction) return;
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
