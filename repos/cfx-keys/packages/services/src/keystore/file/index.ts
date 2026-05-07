import { KeystoreError } from '@cfxdevkit/core';
import type { AesGcmKey } from '../../crypto/index.js';
import type {
  AuditLogger,
  Capability,
  KeystoreCallOptions,
  KeystoreListOptions,
  KeystoreProvider,
  KeystorePutInput,
  SecretRef,
  StoredSecret,
} from '../index.js';
import { noopAuditLogger } from '../index.js';
import { applyCapability } from '../memory/capability.js';
import {
  aadFor,
  checkAborted,
  decryptAesGcm,
  deriveKekFromEnvelope,
  type Envelope,
  encryptAesGcm,
  fromBase64Url,
  plaintextFor,
  readEnvelope,
  refKey,
  signerFromSecret,
  toBase64Url,
  toHex,
  validatePutInput,
  writeEnvelope,
} from './internals.js';

export { changeFilePassphrase, initFileKeystore, type KdfParams } from './internals.js';

export interface FileKeystoreOptions {
  path: string;
  unlock: () => Promise<{ passphrase: string }>;
  audit?: AuditLogger;
}

export async function readFileKeystoreMnemonic(input: {
  path: string;
  passphrase: string;
  ref: SecretRef;
}): Promise<string> {
  const env = await readEnvelope(input.path);
  const rec = env.secrets[refKey(input.ref)];
  if (!rec) throw notFound(input.ref);
  if (rec.kind !== 'mnemonic') throw unsupportedSignerKind(rec.kind);
  const key = await deriveKekFromEnvelope(env, input.passphrase);
  let plaintext: Uint8Array;
  try {
    plaintext = await decryptAesGcm({
      key,
      ciphertext: fromBase64Url(rec.ct),
      iv: fromBase64Url(rec.iv),
      tag: fromBase64Url(rec.tag),
      aad: aadFor(input.ref),
    });
  } catch (cause) {
    throw new KeystoreError({
      code: 'services/keystore/bad-passphrase',
      message: 'failed to decrypt mnemonic with passphrase',
      cause,
    });
  }
  try {
    return new TextDecoder().decode(plaintext).trim();
  } finally {
    plaintext.fill(0);
  }
}

export function createFileKeystore(opts: FileKeystoreOptions): KeystoreProvider {
  const audit = opts.audit ?? noopAuditLogger;
  const id = 'file';
  let kek: AesGcmKey | null = null;
  let unlocking: Promise<AesGcmKey> | null = null;

  async function ensureKek(env: Envelope): Promise<AesGcmKey> {
    if (kek) return kek;
    if (unlocking) return unlocking;
    unlocking = unlockAndProbe(env, opts.unlock, (next) => {
      kek = next;
    });
    try {
      return await unlocking;
    } finally {
      unlocking = null;
    }
  }

  return {
    id,
    capabilities: { write: true, list: true, rotate: false },
    async list(listOpts: KeystoreListOptions = {}): Promise<StoredSecret[]> {
      checkAborted(listOpts.signal);
      const env = await readEnvelope(opts.path);
      const out: StoredSecret[] = [];
      for (const [key, rec] of Object.entries(env.secrets)) {
        const [service, account] = key.split('\0') as [string, string];
        if (listOpts.service && service !== listOpts.service) continue;
        out.push({
          ref: { service, account },
          kind: rec.kind,
          createdAt: rec.createdAt,
          ...(rec.meta !== undefined ? { meta: rec.meta } : {}),
        });
      }
      audit.record({ at: Date.now(), provider: id, action: 'list', ok: true });
      return out;
    },
    async has(ref: SecretRef, callOpts: KeystoreCallOptions = {}): Promise<boolean> {
      checkAborted(callOpts.signal);
      return (await readEnvelope(opts.path)).secrets[refKey(ref)] !== undefined;
    },
    async getSigner(
      ref: SecretRef,
      capability?: Capability,
      callOpts: KeystoreCallOptions = {},
    ): Promise<import('@cfxdevkit/core').Signer> {
      checkAborted(callOpts.signal);
      const env = await readEnvelope(opts.path);
      const rec = env.secrets[refKey(ref)];
      if (!rec) {
        audit.record({ at: Date.now(), provider: id, action: 'getSigner', ref, ok: false });
        throw notFound(ref);
      }
      if (rec.kind !== 'private-key' && rec.kind !== 'mnemonic')
        throw unsupportedSignerKind(rec.kind);
      const pt = await decryptSecret(env, rec, ref, ensureKek);
      const secret = rec.kind === 'private-key' ? toHex(pt) : new TextDecoder().decode(pt);
      pt.fill(0);
      const base = signerFromSecret(rec, secret, callOpts.derivationPath);
      const signer = capability ? applyCapability(base, capability) : base;
      audit.record({ at: Date.now(), provider: id, action: 'getSigner', ref, ok: true });
      return signer;
    },
    async put(input: KeystorePutInput, callOpts: KeystoreCallOptions = {}): Promise<void> {
      checkAborted(callOpts.signal);
      validatePutInput(input);
      const env = await readEnvelope(opts.path);
      const key = await ensureKek(env);
      const pt = plaintextFor({
        ...input,
        secret: input.kind === 'mnemonic' ? input.secret.trim() : input.secret,
      });
      const sealed = await encryptAesGcm({ key, plaintext: pt, aad: aadFor(input.ref) });
      pt.fill(0);
      env.secrets[refKey(input.ref)] = {
        kind: input.kind,
        createdAt: Date.now(),
        ...(input.meta !== undefined ? { meta: input.meta } : {}),
        iv: toBase64Url(sealed.iv),
        ct: toBase64Url(sealed.ciphertext),
        tag: toBase64Url(sealed.tag),
      };
      await writeEnvelope(opts.path, env);
      audit.record({ at: Date.now(), provider: id, action: 'put', ref: input.ref, ok: true });
    },
    async updateMeta(
      ref: SecretRef,
      meta: Record<string, string>,
      callOpts: KeystoreCallOptions = {},
    ): Promise<void> {
      checkAborted(callOpts.signal);
      const env = await readEnvelope(opts.path);
      const rec = env.secrets[refKey(ref)];
      if (!rec) throw notFound(ref);
      rec.meta = meta;
      await writeEnvelope(opts.path, env);
      audit.record({ at: Date.now(), provider: id, action: 'updateMeta', ref, ok: true });
    },
    async remove(ref: SecretRef, callOpts: KeystoreCallOptions = {}): Promise<void> {
      checkAborted(callOpts.signal);
      const env = await readEnvelope(opts.path);
      const ok = delete env.secrets[refKey(ref)];
      await writeEnvelope(opts.path, env);
      audit.record({ at: Date.now(), provider: id, action: 'remove', ref, ok });
      if (!ok) throw notFound(ref);
    },
  };
}

async function unlockAndProbe(
  env: Envelope,
  unlock: FileKeystoreOptions['unlock'],
  cache: (key: AesGcmKey) => void,
) {
  const { passphrase } = await unlock();
  const candidate = await deriveKekFromEnvelope(env, passphrase);
  const first = Object.entries(env.secrets)[0];
  if (first) {
    const [key, rec] = first;
    const [service, account] = key.split('\0') as [string, string];
    try {
      await decryptAesGcm({
        key: candidate,
        ciphertext: fromBase64Url(rec.ct),
        iv: fromBase64Url(rec.iv),
        tag: fromBase64Url(rec.tag),
        aad: aadFor({ service, account }),
      });
    } catch (cause) {
      throw new KeystoreError({
        code: 'services/keystore/bad-passphrase',
        message: 'incorrect passphrase',
        cause,
      });
    }
  }
  cache(candidate);
  return candidate;
}

async function decryptSecret(
  env: Envelope,
  rec: Envelope['secrets'][string],
  ref: SecretRef,
  ensureKek: (env: Envelope) => Promise<AesGcmKey>,
) {
  try {
    return await decryptAesGcm({
      key: await ensureKek(env),
      ciphertext: fromBase64Url(rec.ct),
      iv: fromBase64Url(rec.iv),
      tag: fromBase64Url(rec.tag),
      aad: aadFor(ref),
    });
  } catch (cause) {
    throw new KeystoreError({
      code: 'services/keystore/bad-passphrase',
      message: 'failed to decrypt secret',
      cause,
    });
  }
}

function notFound(ref: SecretRef) {
  return new KeystoreError({
    code: 'services/keystore/not-found',
    message: `secret not found: ${ref.service}/${ref.account}`,
    meta: { ref },
  });
}

function unsupportedSignerKind(kind: StoredSecret['kind']) {
  return new KeystoreError({
    code: 'services/keystore/unsupported',
    message: `file backend cannot create a signer for kind="${kind}"`,
  });
}
