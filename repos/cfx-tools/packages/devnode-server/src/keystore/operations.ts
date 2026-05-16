import { randomUUID } from 'node:crypto';
import type { Signer } from '@cfxdevkit/core';
import { deriveAccount } from '@cfxdevkit/core';
import type { SecretRef, StoredSecret } from '@cfxdevkit/services/keystore';
import {
  type createFileKeystore,
  readFileKeystoreMnemonic,
} from '@cfxdevkit/services/keystore-file';
import type {
  ActiveWalletSummary,
  RevealedSecret,
  RevealKind,
  RevealRequestSummary,
  WalletAccountSummary,
} from '../keystore.js';
import {
  assertAccountIndex,
  createPrivateKeyReveal,
  isActiveWallet,
  META_ACCOUNT_COUNT_KEY,
  META_ACTIVE_ACCOUNT_INDEX_KEY,
  META_ACTIVE_KEY,
  META_DERIVATION_BASE_KEY,
  META_FIRST_ADDRESS_KEY,
  META_NAME_KEY,
  normalizeAccountCount,
  normalizeDerivationBase,
  normalizeRevealTtl,
  normalizeUnlockError,
  REVEAL_WARNING,
  toWalletSummary,
  walletAccountCount,
  walletActiveAccountIndex,
  walletDerivationPath,
  walletMeta,
  walletRef,
} from './domain.js';

export type KeystoreProvider = ReturnType<typeof createFileKeystore>;

export interface LoadedKeystoreState {
  provider: KeystoreProvider;
  passphrase: string;
  wallets: StoredSecret[];
}

export interface RevealSession {
  request: RevealRequestSummary;
  secret: RevealedSecret;
}

export async function readStoredMnemonic(input: {
  path: string;
  passphrase: string;
  ref: SecretRef;
}): Promise<string> {
  try {
    return await readFileKeystoreMnemonic(input);
  } catch (error) {
    throw normalizeUnlockError(error);
  }
}

export async function loadActiveWalletSummary(
  state: LoadedKeystoreState,
): Promise<ActiveWalletSummary | null> {
  const wallet = state.wallets.find(isActiveWallet);
  if (!wallet) return null;

  const derivationPath = walletDerivationPath(wallet, walletActiveAccountIndex(wallet));
  const signer = await state.provider.getSigner(wallet.ref, undefined, { derivationPath });

  return {
    ...toWalletSummary(wallet),
    address: signer.account.address,
    ...(signer.account.coreAddress ? { coreAddress: signer.account.coreAddress } : {}),
    derivationPath,
  };
}

export async function loadActiveSigner(state: LoadedKeystoreState): Promise<Signer> {
  const wallet = state.wallets.find(isActiveWallet);
  if (!wallet) {
    throw new Error('no active wallet is available');
  }

  return state.provider.getSigner(wallet.ref, undefined, {
    derivationPath: walletDerivationPath(wallet, walletActiveAccountIndex(wallet)),
  });
}

export async function readWalletMnemonicFromState(
  path: string,
  state: LoadedKeystoreState,
  wallet: StoredSecret,
): Promise<string> {
  return readStoredMnemonic({ path, passphrase: state.passphrase, ref: wallet.ref });
}

export async function addWalletSecret(
  state: LoadedKeystoreState,
  mnemonic: string,
  name: string,
  options: { accountCount?: number; derivationBase?: string },
): Promise<string> {
  const id = randomUUID();
  const accountCount = normalizeAccountCount(options.accountCount);
  const derivationBase = normalizeDerivationBase(options.derivationBase);
  const first = deriveAccount({ mnemonic, path: `${derivationBase}/0` });

  await state.provider.put?.({
    ref: walletRef(id),
    kind: 'mnemonic',
    secret: mnemonic,
    meta: {
      [META_NAME_KEY]: name,
      [META_ACTIVE_KEY]: state.wallets.some(isActiveWallet) ? 'false' : 'true',
      [META_ACCOUNT_COUNT_KEY]: String(accountCount),
      [META_ACTIVE_ACCOUNT_INDEX_KEY]: '0',
      [META_DERIVATION_BASE_KEY]: derivationBase,
      [META_FIRST_ADDRESS_KEY]: first.account.address,
    },
  });

  return id;
}

export async function updateActiveWallet(
  state: LoadedKeystoreState,
  target: StoredSecret,
  accountIndex: number,
): Promise<void> {
  assertAccountIndex(target, accountIndex);

  if (!isActiveWallet(target)) {
    for (const wallet of state.wallets) {
      if (!isActiveWallet(wallet)) continue;
      await state.provider.updateMeta?.(
        wallet.ref,
        walletMeta(wallet, { [META_ACTIVE_KEY]: 'false' }),
      );
    }
  }

  await state.provider.updateMeta?.(
    target.ref,
    walletMeta(target, {
      [META_ACTIVE_KEY]: 'true',
      [META_ACTIVE_ACCOUNT_INDEX_KEY]: String(accountIndex),
    }),
  );
}

export async function listWalletAccounts(
  state: LoadedKeystoreState,
  wallet: StoredSecret,
): Promise<WalletAccountSummary[]> {
  const activeIndex = walletActiveAccountIndex(wallet);
  const accountCount = walletAccountCount(wallet);
  const accounts: WalletAccountSummary[] = [];

  for (let index = 0; index < accountCount; index++) {
    const derivationPath = walletDerivationPath(wallet, index);
    const signer = await state.provider.getSigner(wallet.ref, undefined, { derivationPath });
    accounts.push({
      index,
      derivationPath,
      address: signer.account.address,
      ...(signer.account.coreAddress ? { coreAddress: signer.account.coreAddress } : {}),
      active: isActiveWallet(wallet) && index === activeIndex,
    });
  }

  return accounts;
}

export async function createRevealSession(input: {
  kind: RevealKind;
  ttlMs?: number;
  path: string;
  ref: SecretRef;
  wallet: StoredSecret;
  walletId: string;
  passphrase: string;
  accountIndex?: number;
  revealSessions: Map<string, RevealSession>;
}): Promise<RevealRequestSummary> {
  const mnemonic = await readStoredMnemonic({
    path: input.path,
    passphrase: input.passphrase,
    ref: input.ref,
  });
  const token = randomUUID();
  const expiresAt = Date.now() + normalizeRevealTtl(input.ttlMs);
  const request: RevealRequestSummary = {
    token,
    kind: input.kind,
    walletId: input.walletId,
    expiresAt,
    warning: REVEAL_WARNING,
  };

  const secret =
    input.kind === 'mnemonic'
      ? ({ kind: 'mnemonic', walletId: input.walletId, mnemonic } satisfies RevealedSecret)
      : createPrivateKeyReveal(input.wallet, mnemonic, input.walletId, input.accountIndex);

  if (secret.accountIndex !== undefined) {
    request.accountIndex = secret.accountIndex;
  }

  input.revealSessions.set(token, { request, secret });
  return request;
}

export async function removeWallet(
  state: LoadedKeystoreState,
  target: StoredSecret,
): Promise<boolean> {
  const wasActive = isActiveWallet(target);
  await state.provider.remove?.(target.ref);
  return wasActive;
}

export async function renameWallet(
  state: LoadedKeystoreState,
  wallet: StoredSecret,
  name: string,
): Promise<void> {
  await state.provider.updateMeta?.(wallet.ref, walletMeta(wallet, { [META_NAME_KEY]: name }));
}
