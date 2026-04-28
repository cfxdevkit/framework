/**
 * `@cfxdevkit/services/keystore-memory` — tests-only in-memory keystore.
 *
 * Holds private keys in RAM and produces `Signer`s via `core/wallet`'s
 * `signerFromPrivateKey`. **Never** import this from production code: the
 * module guard refuses to load when `NODE_ENV === 'production'`.
 */

import type { Hex, Signer } from '@cfxdevkit/core';
import { KeystoreError } from '@cfxdevkit/core';
import { signerFromPrivateKey } from '@cfxdevkit/core/wallet';
import {
  type AuditLogger,
  type Capability,
  type KeystoreCallOptions,
  type KeystoreListOptions,
  type KeystoreProvider,
  type KeystorePutInput,
  noopAuditLogger,
  type SecretRef,
  type StoredSecret,
} from '../index.js';
import { applyCapability } from './capability.js';

if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production') {
  throw new KeystoreError({
    code: 'services/keystore/unsupported',
    message: '@cfxdevkit/services/keystore-memory must not be loaded in production',
  });
}

export interface MemoryKeystoreSeed {
  ref: SecretRef;
  privateKey: Hex;
  meta?: Record<string, string>;
}

export interface MemoryKeystoreOptions {
  seed?: MemoryKeystoreSeed[];
  audit?: AuditLogger;
}

interface MemoryEntry {
  privateKey: Hex;
  stored: StoredSecret;
}

function refKey(ref: SecretRef): string {
  return `${ref.service}\0${ref.account}`;
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: 'operation aborted',
      cause: signal.reason,
    });
  }
}

/** Build an in-memory `KeystoreProvider`. Tests-only. */
export function createMemoryKeystore(opts: MemoryKeystoreOptions = {}): KeystoreProvider {
  const audit = opts.audit ?? noopAuditLogger;
  const store = new Map<string, MemoryEntry>();

  for (const s of opts.seed ?? []) {
    store.set(refKey(s.ref), {
      privateKey: s.privateKey,
      stored: {
        ref: s.ref,
        kind: 'private-key',
        createdAt: Date.now(),
        ...(s.meta !== undefined ? { meta: s.meta } : {}),
      },
    });
  }

  const id = 'memory';

  return {
    id,
    capabilities: { write: true, list: true, rotate: false },

    async list(listOpts: KeystoreListOptions = {}): Promise<StoredSecret[]> {
      checkAborted(listOpts.signal);
      const out: StoredSecret[] = [];
      for (const e of store.values()) {
        if (listOpts.service && e.stored.ref.service !== listOpts.service) continue;
        out.push(e.stored);
      }
      audit.record({ at: Date.now(), provider: id, action: 'list', ok: true });
      return out;
    },

    async has(ref: SecretRef, callOpts: KeystoreCallOptions = {}): Promise<boolean> {
      checkAborted(callOpts.signal);
      return store.has(refKey(ref));
    },

    async getSigner(
      ref: SecretRef,
      capability?: Capability,
      callOpts: KeystoreCallOptions = {},
    ): Promise<Signer> {
      checkAborted(callOpts.signal);
      const entry = store.get(refKey(ref));
      if (!entry) {
        audit.record({ at: Date.now(), provider: id, action: 'getSigner', ref, ok: false });
        throw new KeystoreError({
          code: 'services/keystore/not-found',
          message: `secret not found: ${ref.service}/${ref.account}`,
          meta: { ref },
        });
      }
      const base = signerFromPrivateKey(entry.privateKey);
      const signer = capability ? applyCapability(base, capability) : base;
      audit.record({ at: Date.now(), provider: id, action: 'getSigner', ref, ok: true });
      return signer;
    },

    async put(input: KeystorePutInput, callOpts: KeystoreCallOptions = {}): Promise<void> {
      checkAborted(callOpts.signal);
      if (input.kind !== 'private-key') {
        throw new KeystoreError({
          code: 'services/keystore/unsupported',
          message: `memory backend only supports kind="private-key" (got ${input.kind})`,
        });
      }
      if (typeof input.secret !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(input.secret)) {
        throw new KeystoreError({
          code: 'services/keystore/unsupported',
          message: 'secret must be a 0x-prefixed 32-byte hex private key',
        });
      }
      store.set(refKey(input.ref), {
        privateKey: input.secret as Hex,
        stored: {
          ref: input.ref,
          kind: 'private-key',
          createdAt: Date.now(),
          ...(input.meta !== undefined ? { meta: input.meta } : {}),
        },
      });
      audit.record({ at: Date.now(), provider: id, action: 'put', ref: input.ref, ok: true });
    },

    async remove(ref: SecretRef, callOpts: KeystoreCallOptions = {}): Promise<void> {
      checkAborted(callOpts.signal);
      const ok = store.delete(refKey(ref));
      audit.record({ at: Date.now(), provider: id, action: 'remove', ref, ok });
      if (!ok) {
        throw new KeystoreError({
          code: 'services/keystore/not-found',
          message: `secret not found: ${ref.service}/${ref.account}`,
          meta: { ref },
        });
      }
    },
  };
}
