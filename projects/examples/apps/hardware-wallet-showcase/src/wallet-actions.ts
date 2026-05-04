import type { Hex, SignableTx } from '@cfxdevkit/core';
import { type Signer, signerFromPrivateKey } from '@cfxdevkit/core/wallet';
import type { DevNodeAccountSnapshot } from './devnode-client.js';
import type { LedgerMode } from './ledger-session.js';

export const LOCAL_RPC: Record<LedgerMode, string> = {
  core: '/rpc/core',
  espace: '/rpc/espace',
};

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

export const DEFAULT_TX: TxDraft = {
  to: '',
  value: '0',
  nonce: '0',
  data: '0x',
  gas: '21000',
  gasPrice: '1000000000',
  maxFeePerGas: '1000000000',
  maxPriorityFeePerGas: '1000000',
  storageLimit: '0',
  epochHeight: '1',
};

export function buildTransaction(mode: LedgerMode, signer: Signer, draft: TxDraft): SignableTx {
  if (mode === 'core') {
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

export async function getNativeBalance(
  rpcUrl: string,
  mode: LedgerMode,
  signer: Signer,
): Promise<string> {
  const address = mode === 'core' ? signer.account.coreAddress : signer.account.address;
  if (!address) throw new Error('Address is unavailable');
  const result = await rpc(rpcUrl, mode === 'core' ? 'cfx_getBalance' : 'eth_getBalance', [
    address,
    mode === 'core' ? 'latest_state' : 'latest',
  ]);
  return BigInt(result as Hex).toString();
}

export function formatNativeBalance(balance: string): string {
  if (!balance) return 'not loaded';
  const value = BigInt(balance);
  const whole = value / 1_000_000_000_000_000_000n;
  const fraction = (value % 1_000_000_000_000_000_000n).toString().padStart(18, '0');
  const trimmed = fraction.replace(/0+$/, '').slice(0, 6);
  return `${whole.toString()}${trimmed ? `.${trimmed}` : ''} CFX`;
}

export async function broadcastRawTransaction(
  rpcUrl: string,
  mode: LedgerMode,
  rawTx: Hex,
): Promise<string> {
  const method = mode === 'core' ? 'cfx_sendRawTransaction' : 'eth_sendRawTransaction';
  return String(await rpc(rpcUrl, method, [rawTx]));
}

export async function broadcastAndRefresh(input: {
  rpcUrl: string;
  mode: LedgerMode;
  signer: Signer;
  rawTx: Hex;
  afterBroadcast?(): Promise<void>;
}): Promise<{ txHash: string; balance: string }> {
  const txHash = await broadcastRawTransaction(input.rpcUrl, input.mode, input.rawTx);
  await input.afterBroadcast?.();
  const balance = await getNativeBalance(input.rpcUrl, input.mode, input.signer);
  return { txHash, balance };
}

export async function signBroadcastAndRefresh(input: {
  rpcUrl: string;
  mode: LedgerMode;
  signer: Signer;
  draft: TxDraft;
  afterBroadcast?(): Promise<void>;
}): Promise<{ rawTx: Hex; txHash: string; balance: string }> {
  const tx = buildTransaction(input.mode, input.signer, input.draft);
  const rawTx = await input.signer.signTransaction(tx);
  const result = await broadcastAndRefresh({ ...input, rawTx });
  return { rawTx, ...result };
}

export async function fundConnectedAddress(input: {
  rpcUrl: string;
  mode: LedgerMode;
  signer: Signer;
  faucet: DevNodeAccountSnapshot;
}): Promise<string> {
  const faucetSigner = signerFromPrivateKey(input.faucet.privateKey as Hex, 2029);
  if (input.mode === 'core') {
    const to = input.signer.account.coreAddress;
    if (!to) throw new Error('Core address is unavailable');
    const from = faucetSigner.account.coreAddress;
    if (!from) throw new Error('Faucet Core address is unavailable');
    const [nonceHex, gasPriceHex, epochHex] = await Promise.all([
      rpc(input.rpcUrl, 'cfx_getNextNonce', [from, 'latest_state']),
      rpc(input.rpcUrl, 'cfx_gasPrice', []),
      rpc(input.rpcUrl, 'cfx_epochNumber', ['latest_state']),
    ]);
    const rawTx = await faucetSigner.signTransaction({
      family: 'core',
      coreType: 'legacy',
      chainId: 2029,
      to,
      value: 1_000_000_000_000_000_000n,
      nonce: Number(hexToBigInt(String(nonceHex) as Hex)),
      gas: 21000n,
      gasPrice: hexToBigInt(String(gasPriceHex) as Hex),
      storageLimit: 0n,
      epochHeight: hexToBigInt(String(epochHex) as Hex),
      data: '0x',
    });
    return broadcastRawTransaction(input.rpcUrl, 'core', rawTx);
  }
  const to = input.signer.account.address;
  const nonceHex = await rpc(input.rpcUrl, 'eth_getTransactionCount', [
    faucetSigner.account.address,
    'pending',
  ]);
  const rawTx = await faucetSigner.signTransaction({
    family: 'espace',
    chainId: 2030,
    to,
    value: 1_000_000_000_000_000_000n,
    nonce: Number(hexToBigInt(String(nonceHex) as Hex)),
    gas: 21000n,
    maxFeePerGas: 2_000_000_000n,
    maxPriorityFeePerGas: 1_000_000_000n,
    data: '0x',
  });
  return broadcastRawTransaction(input.rpcUrl, 'espace', rawTx);
}

export function setTransferDraft(input: {
  to: string;
  amountCfx: string;
  current: TxDraft;
}): TxDraft {
  return {
    ...input.current,
    to: input.to,
    value: cfxToDrip(input.amountCfx).toString(),
  };
}

async function rpc(rpcUrl: string, method: string, params: unknown[]): Promise<unknown> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
      signal: controller.signal,
    });
    const payload = (await response.json()) as { result?: unknown; error?: { message?: string } };
    if (payload.error) throw new Error(payload.error.message ?? `${method} failed`);
    return payload.result;
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw new Error(
        `${method} timed out after 15s. Check that the local node and RPC URL are reachable.`,
      );
    }
    throw cause;
  } finally {
    window.clearTimeout(timeout);
  }
}

function hexToBigInt(value: Hex): bigint {
  return BigInt(value);
}

function parseBigInt(value: string): bigint {
  const trimmed = value.trim();
  return trimmed.startsWith('0x') ? BigInt(trimmed) : BigInt(trimmed || '0');
}

function parseNumber(value: string): number {
  return Number(parseBigInt(value));
}

function parseHex(value: string): Hex {
  const trimmed = value.trim();
  return (trimmed ? trimmed : '0x') as Hex;
}

function cfxToDrip(value: string): bigint {
  const trimmed = value.trim() || '0';
  const [whole = '0', fraction = ''] = trimmed.split('.');
  if (!/^\d+$/.test(whole) || !/^\d*$/.test(fraction)) throw new Error('Amount must be a number');
  return BigInt(whole) * 1_000_000_000_000_000_000n + BigInt(fraction.padEnd(18, '0').slice(0, 18));
}
