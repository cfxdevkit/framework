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
