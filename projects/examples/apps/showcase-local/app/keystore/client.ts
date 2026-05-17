import type { DevnodeAccountsResponse } from '../../lib/devnode-types';
import { showcaseRuntimeClient } from '../runtime/devkit-client';

export async function fetchDevnodeAccounts(): Promise<DevnodeAccountsResponse> {
  const accounts = await showcaseRuntimeClient.accounts.list();
  let faucet: DevnodeAccountsResponse['faucet'];

  if (accounts.accounts.length > 0) {
    try {
      const result = await showcaseRuntimeClient.accounts.faucet();
      faucet = {
        ...result.faucet,
        initialBalanceCfx: String(result.faucet.initialBalanceCfx),
      };
    } catch {
      faucet = undefined;
    }
  }

  return {
    ok: accounts.ok,
    accounts: accounts.accounts.map((account) => ({
      ...account,
      initialBalanceCfx: String(account.initialBalanceCfx),
    })),
    ...(faucet ? { faucet } : {}),
  };
}

export interface RevealRequestInput {
  walletId: string;
  passphrase: string;
  kind: 'mnemonic' | 'private-key';
  accountIndex?: number;
  ttlMs?: number;
}

export interface RevealRequestResponse {
  ok: boolean;
  request?: { token: string };
  error?: string;
}

export interface RevealSecretResponse {
  ok: boolean;
  secret?: string;
  error?: string;
}

export async function revealSecret(input: RevealRequestInput): Promise<RevealSecretResponse> {
  const reqRes = await fetch('/api/keystore/reveal/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const req = (await reqRes.json()) as RevealRequestResponse;
  if (!req.ok || !req.request?.token) {
    return { ok: false, ...(req.error !== undefined ? { error: req.error } : {}) };
  }

  const conRes = await fetch('/api/keystore/reveal/consume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: req.request.token }),
  });
  const con = (await conRes.json()) as {
    ok: boolean;
    reveal?: { mnemonic?: string; privateKey?: string };
    error?: string;
  };
  if (!con.ok) {
    return { ok: false, ...(con.error !== undefined ? { error: con.error } : {}) };
  }
  const secret = con.reveal?.mnemonic ?? con.reveal?.privateKey;
  return { ok: true, ...(secret !== undefined ? { secret } : {}) };
}
