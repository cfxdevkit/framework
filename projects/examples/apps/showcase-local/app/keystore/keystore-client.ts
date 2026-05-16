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

export async function fetchKeystoreStatus(): Promise<KeystoreStatusResponse> {
  return requestKeystore<KeystoreStatusResponse>('/api/keystore/status', { method: 'GET' });
}

export async function setupKeystore(passphrase: string): Promise<KeystoreActionResponse> {
  return requestKeystore<KeystoreActionResponse>('/api/keystore/setup', {
    body: JSON.stringify({ passphrase }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
}

export async function unlockKeystore(passphrase: string): Promise<KeystoreActionResponse> {
  return requestKeystore<KeystoreActionResponse>('/api/keystore/unlock', {
    body: JSON.stringify({ passphrase }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
}

export async function lockKeystore(): Promise<KeystoreActionResponse> {
  return requestKeystore<KeystoreActionResponse>('/api/keystore/lock', { method: 'POST' });
}

export async function fetchKeystoreWallets(): Promise<KeystoreWalletsResponse> {
  return requestKeystore<KeystoreWalletsResponse>('/api/keystore/accounts', { method: 'GET' });
}

export async function fetchActiveKeystoreWallet(): Promise<KeystoreActiveWalletResponse> {
  return requestKeystore<KeystoreActiveWalletResponse>('/api/keystore/active', { method: 'GET' });
}

export async function fetchKeystoreWalletAccounts(
  id: string,
): Promise<KeystoreWalletAccountsResponse> {
  return requestKeystore<KeystoreWalletAccountsResponse>(`/api/keystore/wallets/${id}/accounts`, {
    method: 'GET',
  });
}

export async function createKeystoreWallet(
  input: CreateKeystoreWalletRequest,
): Promise<KeystoreWalletMutationResponse> {
  return requestKeystore<KeystoreWalletMutationResponse>('/api/keystore/accounts', {
    body: JSON.stringify(input),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
}

export async function activateKeystoreWallet(id: string): Promise<KeystoreActionResponse> {
  return requestKeystore<KeystoreActionResponse>(`/api/keystore/accounts/${id}/activate`, {
    method: 'PUT',
  });
}

export async function activateKeystoreAccount(
  id: string,
  index: number,
): Promise<KeystoreActionResponse> {
  return requestKeystore<KeystoreActionResponse>(
    `/api/keystore/wallets/${id}/accounts/${index}/activate`,
    { method: 'PUT' },
  );
}

export async function deleteKeystoreWallet(id: string): Promise<KeystoreActionResponse> {
  return requestKeystore<KeystoreActionResponse>(`/api/keystore/accounts/${id}`, {
    method: 'DELETE',
  });
}

export async function renameKeystoreWallet(
  id: string,
  name: string,
): Promise<KeystoreActionResponse> {
  return requestKeystore<KeystoreActionResponse>(`/api/keystore/accounts/${id}/rename`, {
    body: JSON.stringify({ name } satisfies RenameKeystoreWalletRequest),
    headers: { 'content-type': 'application/json' },
    method: 'PATCH',
  });
}

export async function fetchDevnodeAccounts(): Promise<DevnodeAccountsResponse> {
  const response = await fetch('/api/devnode/accounts', { cache: 'no-store', method: 'GET' });
  const payload = (await response.json()) as DevnodeAccountsResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? 'GET /api/devnode/accounts failed');
  }

  return payload;
}

async function requestKeystore<T extends { error?: string }>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(path, { ...init, cache: 'no-store' });
  const payload = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(payload.error ?? `${init.method ?? 'GET'} ${path} failed`);
  }

  return payload;
}
