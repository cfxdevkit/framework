import type { Hex } from '@cfxdevkit/core';
import type { TxDraft } from './wallet-actions.js';

export interface FileKeystoreAccount {
  providerId?: string;
  path?: string;
  listed?: string[];
  address: string;
  coreAddress: string;
  notice?: string;
}

export interface FileKeystoreResult extends FileKeystoreAccount {
  rawTx?: Hex;
  txHash?: string;
  balance?: string;
  contractAddress?: string;
  artifact?: { name: string; contractName: string };
  notice: string;
}

type Mode = 'core' | 'espace';

export const fileKeystoreClient = {
  unlock(passphrase: string): Promise<FileKeystoreAccount> {
    return request('/keystore/file/unlock', { passphrase });
  },
  balance(mode: Mode): Promise<{ balance: string }> {
    return request('/keystore/file/balance', { mode });
  },
  signMessage(message: string): Promise<FileKeystoreResult> {
    return request('/keystore/file/sign-message', { message });
  },
  signTransfer(mode: Mode, draft: TxDraft): Promise<FileKeystoreResult> {
    return request('/keystore/file/sign-transfer', { mode, draft });
  },
  async broadcast(mode: Mode, rawTx: Hex): Promise<FileKeystoreResult> {
    return settleResult(mode, await request('/keystore/file/broadcast', { mode, rawTx }));
  },
  async sendTransfer(mode: Mode, draft: TxDraft): Promise<FileKeystoreResult> {
    return settleResult(mode, await request('/keystore/file/send-transfer', { mode, draft }));
  },
  async faucet(mode: Mode): Promise<FileKeystoreResult> {
    return settleResult(mode, await request('/keystore/file/faucet', { mode }));
  },
  async deploy(mode: Mode): Promise<FileKeystoreResult> {
    return settleResult(mode, await request('/keystore/file/deploy', { mode }));
  },
};

async function settleResult(mode: Mode, result: FileKeystoreResult): Promise<FileKeystoreResult> {
  await request('/api/devnode/mine', { pack: true }).catch(() => undefined);
  const balance = await fileKeystoreClient.balance(mode).catch(() => ({ balance: result.balance }));
  const nextBalance = balance.balance ?? result.balance;
  return nextBalance === undefined ? result : { ...result, balance: nextBalance };
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok || payload.error) throw new Error(payload.error ?? `${path} failed`);
  return payload;
}
