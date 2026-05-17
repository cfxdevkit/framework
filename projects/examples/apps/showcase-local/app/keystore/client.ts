import { generateMnemonic } from '@cfxdevkit/core';
import type { DevnodeAccountsResponse } from '../../lib/devnode-types';
import type {
  CreateKeystoreWalletRequest,
  KeystoreActionResponse,
  KeystoreActiveWalletResponse,
  KeystoreStatusResponse,
  KeystoreWalletAccountsResponse,
  KeystoreWalletMutationResponse,
  KeystoreWalletsResponse,
  RenameKeystoreWalletRequest,
} from '../../lib/keystore-types';
import { showcaseRuntimeClient } from '../runtime/devkit-client';

export async function fetchKeystoreStatus(): Promise<KeystoreStatusResponse> {
  return showcaseRuntimeClient.keystore.status();
}

export async function setupKeystore(passphrase: string): Promise<KeystoreActionResponse> {
  return showcaseRuntimeClient.keystore.setup({ passphrase });
}

export async function unlockKeystore(passphrase: string): Promise<KeystoreActionResponse> {
  return showcaseRuntimeClient.keystore.unlock({ passphrase });
}

export async function lockKeystore(): Promise<KeystoreActionResponse> {
  return showcaseRuntimeClient.keystore.lock();
}

export async function fetchKeystoreWallets(): Promise<KeystoreWalletsResponse> {
  return showcaseRuntimeClient.keystore.wallets.list();
}

export async function fetchActiveKeystoreWallet(): Promise<KeystoreActiveWalletResponse> {
  return showcaseRuntimeClient.keystore.active();
}

export async function fetchKeystoreWalletAccounts(
  id: string,
): Promise<KeystoreWalletAccountsResponse> {
  return showcaseRuntimeClient.keystore.wallets.accounts(id);
}

export async function createKeystoreWallet(
  input: CreateKeystoreWalletRequest,
): Promise<KeystoreWalletMutationResponse> {
  return showcaseRuntimeClient.keystore.wallets.add({
    mnemonic: input.mnemonic?.trim() || generateMnemonic(128),
    name: input.name?.trim() || 'Showcase Wallet',
    ...(input.accountCount === undefined ? {} : { accountCount: input.accountCount }),
    ...(input.accountType === undefined ? {} : { accountType: input.accountType }),
  });
}

export async function activateKeystoreWallet(id: string): Promise<KeystoreActionResponse> {
  return showcaseRuntimeClient.keystore.wallets.activate(id);
}

export async function activateKeystoreAccount(
  id: string,
  index: number,
): Promise<KeystoreActionResponse> {
  return showcaseRuntimeClient.keystore.wallets.activateAccount(id, index);
}

export async function deleteKeystoreWallet(id: string): Promise<KeystoreActionResponse> {
  return showcaseRuntimeClient.keystore.wallets.delete(id);
}

export async function renameKeystoreWallet(
  id: string,
  name: string,
): Promise<KeystoreActionResponse> {
  return showcaseRuntimeClient.keystore.wallets.rename(
    id,
    ({ name } satisfies RenameKeystoreWalletRequest).name ?? name,
  );
}

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

// ── Secret reveal helpers ─────────────────────────────────────────────────────

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

export interface RevealConsumeResponse {
  ok: boolean;
  reveal?: { secret: string };
  error?: string;
}

export interface RevealSecretResponse {
  ok: boolean;
  secret?: string;
  error?: string;
}

/**
 * Single-call helper: requests a one-time token then immediately consumes it.
 * The two-step backend protocol is an implementation detail hidden here.
 */
export async function revealSecret(input: RevealRequestInput): Promise<RevealSecretResponse> {
  // Step 1 — obtain a one-time token
  const reqRes = await fetch('/api/keystore/reveal/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const req = (await reqRes.json()) as RevealRequestResponse;
  if (!req.ok || !req.request?.token) {
    return { ok: false, ...(req.error !== undefined ? { error: req.error } : {}) };
  }

  // Step 2 — consume the token immediately
  const conRes = await fetch('/api/keystore/reveal/consume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: req.request.token }),
  });
  // Backend returns `reveal.mnemonic` or `reveal.privateKey` depending on kind.
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
