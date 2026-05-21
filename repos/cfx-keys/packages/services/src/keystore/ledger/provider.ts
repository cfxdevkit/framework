import { KeystoreError, type Signer } from '@cfxdevkit/cdk';
import { DEFAULT_CORE_PATH, DEFAULT_ESPACE_PATH } from '@cfxdevkit/cdk/wallet';
import {
  type AuditLogger,
  type Capability,
  type KeystoreCallOptions,
  type KeystoreListOptions,
  type KeystoreProvider,
  noopAuditLogger,
  type SecretRef,
  type StoredSecret,
} from '../index.js';
import { applyCapability } from '../memory/capability.js';
import { signerFromLedger } from './signer.js';
import type { LedgerAccountConfig, LedgerKeystoreOptions, ResolvedLedgerAccount } from './types.js';

export function createLedgerKeystore(opts: LedgerKeystoreOptions): KeystoreProvider {
  const audit = opts.audit ?? noopAuditLogger;
  const id = 'ledger';
  const accounts = new Map<string, ResolvedLedgerAccount>();
  const configured = opts.accounts ?? [defaultLedgerAccount(opts.defaultPath)];
  for (const account of configured) {
    const resolved = resolveAccount(account, opts.defaultPath, opts.defaultChainId);
    accounts.set(refKey(resolved.ref), resolved);
  }
  return {
    id,
    capabilities: { write: false, list: true, rotate: false },
    async list(listOpts: KeystoreListOptions = {}): Promise<StoredSecret[]> {
      checkAborted(listOpts.signal);
      const out: StoredSecret[] = [];
      for (const account of accounts.values()) {
        if (listOpts.service && account.ref.service !== listOpts.service) continue;
        out.push(account.stored);
      }
      audit.record({ at: Date.now(), provider: id, action: 'list', ok: true });
      return out;
    },
    async has(ref: SecretRef, callOpts: KeystoreCallOptions = {}): Promise<boolean> {
      checkAborted(callOpts.signal);
      return accounts.has(refKey(ref));
    },
    async getSigner(
      ref: SecretRef,
      capability?: Capability,
      callOpts: KeystoreCallOptions = {},
    ): Promise<Signer> {
      checkAborted(callOpts.signal);
      const account = accounts.get(refKey(ref));
      if (!account) throw notFound(ref, id, audit);
      const base = await signerFromLedger({
        ...(opts.eth !== undefined ? { eth: opts.eth } : {}),
        ...(opts.coreTransport !== undefined ? { coreTransport: opts.coreTransport } : {}),
        family: account.family,
        path: callOpts.derivationPath ?? account.path,
        ...(account.chainId !== undefined ? { chainId: account.chainId } : {}),
        ...(account.coreNetworkId !== undefined ? { coreNetworkId: account.coreNetworkId } : {}),
        ...(account.expectedAddress !== undefined
          ? { expectedAddress: account.expectedAddress }
          : {}),
        showAddressOnDevice: account.showAddressOnDevice,
      });
      const signer = capability ? applyCapability(base, capability) : base;
      audit.record({ at: Date.now(), provider: id, action: 'getSigner', ref, ok: true });
      return signer;
    },
  };
}

function defaultLedgerAccount(path: string = DEFAULT_ESPACE_PATH): LedgerAccountConfig {
  return { ref: { service: 'ledger', account: 'espace-0' }, family: 'espace', path };
}

function resolveAccount(
  account: LedgerAccountConfig,
  defaultPath: string = DEFAULT_ESPACE_PATH,
  defaultChainId?: number,
): ResolvedLedgerAccount {
  const family = account.family ?? 'espace';
  const path = account.path ?? (family === 'core' ? DEFAULT_CORE_PATH : defaultPath);
  const chainId = account.chainId ?? defaultChainId;
  return {
    ref: account.ref,
    family,
    path,
    ...(chainId !== undefined ? { chainId } : {}),
    ...(account.coreNetworkId !== undefined ? { coreNetworkId: account.coreNetworkId } : {}),
    ...(account.expectedAddress !== undefined ? { expectedAddress: account.expectedAddress } : {}),
    showAddressOnDevice: account.showAddressOnDevice ?? false,
    stored: {
      ref: account.ref,
      kind: 'opaque',
      createdAt: account.createdAt ?? Date.now(),
      meta: {
        backend: 'ledger',
        app: family === 'core' ? 'conflux-core' : 'ethereum',
        path,
        ...(chainId !== undefined ? { chainId: String(chainId) } : {}),
        ...(account.coreNetworkId !== undefined
          ? { coreNetworkId: String(account.coreNetworkId) }
          : {}),
        ...(account.meta ?? {}),
      },
    },
  };
}

function refKey(ref: SecretRef): string {
  return `${ref.service}\0${ref.account}`;
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new KeystoreError({
      code: 'services/keystore/ledger/aborted',
      message: 'Ledger operation aborted',
      cause: signal.reason,
    });
  }
}

function notFound(ref: SecretRef, id: string, audit: AuditLogger): KeystoreError {
  audit.record({ at: Date.now(), provider: id, action: 'getSigner', ref, ok: false });
  return new KeystoreError({
    code: 'services/keystore/not-found',
    message: `Ledger account not found: ${ref.service}/${ref.account}`,
    meta: { ref },
  });
}
