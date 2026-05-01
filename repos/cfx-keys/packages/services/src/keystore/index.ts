/**
 * `@cfxdevkit/services/keystore` — provider interface.
 *
 * Defines the `KeystoreProvider` contract that all backends (memory, file, OS,
 * KMS, forwarded) implement. Private key material is **never** returned across
 * this boundary — providers only hand back a `Signer` from `core/wallet`.
 *
 * Concrete backends live in sibling sub-paths:
 * - `@cfxdevkit/services/keystore-memory` — tests only
 * - `@cfxdevkit/services/keystore-file`   — encrypted file
 * - `@cfxdevkit/services/keystore-os`     — OS keyring
 * - `@cfxdevkit/services/keystore-kms`    — cloud KMS / Vault / Ledger
 * - `@cfxdevkit/services/keystore-forward`— host socket → container bridge
 */
import type { Address, ChainId, Hex, Signer } from '@cfxdevkit/core';

/** Stable identifier for a stored secret within a backend. */
export interface SecretRef {
  /** Logical service / namespace, e.g. "cfxdevkit". */
  service: string;
  /** Secret name within the service, e.g. "deployer". */
  account: string;
}

/** Unix epoch milliseconds. */
export type Timestamp = number;

/**
 * Optional capability scope applied when building a `Signer`. Backends that
 * support capability enforcement MUST validate these constraints at sign time.
 */
export interface Capability {
  chains?: ChainId[];
  contracts?: Address[];
  /** 4-byte function selectors (0x-prefixed). */
  selectors?: Hex[];
  maxValuePerTx?: bigint;
  notAfter?: Timestamp;
}

/** Public metadata about a stored secret. Never contains key material. */
export interface StoredSecret {
  ref: SecretRef;
  kind: 'private-key' | 'mnemonic' | 'opaque';
  createdAt: Timestamp;
  /** Free-form labels. MUST NOT contain private content. */
  meta?: Record<string, string>;
}

/** Backend feature flags advertised to consumers. */
export interface KeystoreCapabilities {
  write: boolean;
  list: boolean;
  rotate: boolean;
}

export interface KeystoreListOptions {
  service?: string;
  signal?: AbortSignal;
}

export interface KeystoreCallOptions {
  signal?: AbortSignal;
  derivationPath?: string;
}

export interface KeystorePutInput {
  ref: SecretRef;
  kind: StoredSecret['kind'];
  /** Hex-encoded private key, BIP-39 mnemonic string, or opaque blob. */
  secret: Hex | string;
  meta?: Record<string, string>;
}

/**
 * Pluggable keystore backend. All methods are async; cancellation is honored
 * via `signal`. Optional methods (`put`, `remove`, `rotate`) MUST be omitted
 * (not present) on read-only backends, not implemented to throw.
 */
export interface KeystoreProvider {
  /** Stable backend id, e.g. `"memory"`, `"file"`, `"os"`, `"kms-aws"`. */
  readonly id: string;
  readonly capabilities: KeystoreCapabilities;

  list(opts?: KeystoreListOptions): Promise<StoredSecret[]>;
  has(ref: SecretRef, opts?: KeystoreCallOptions): Promise<boolean>;

  /**
   * Build a {@link Signer} bound to the named secret. Private material never
   * crosses this boundary — the returned signer holds it internally.
   */
  getSigner(ref: SecretRef, capability?: Capability, opts?: KeystoreCallOptions): Promise<Signer>;

  put?(input: KeystorePutInput, opts?: KeystoreCallOptions): Promise<void>;
  updateMeta?(
    ref: SecretRef,
    meta: Record<string, string>,
    opts?: KeystoreCallOptions,
  ): Promise<void>;
  remove?(ref: SecretRef, opts?: KeystoreCallOptions): Promise<void>;
  rotate?(ref: SecretRef, opts?: KeystoreCallOptions): Promise<{ ref: SecretRef }>;
}

// ── Audit ────────────────────────────────────────────────────────────────────

export interface AuditEntry {
  at: Timestamp;
  provider: string;
  action: string;
  ref?: SecretRef;
  ok: boolean;
  meta?: Record<string, unknown>;
}

export interface AuditLogger {
  record(entry: AuditEntry): void;
}

/** Drop-all audit sink. Default for non-production use. */
export const noopAuditLogger: AuditLogger = {
  record(_entry: AuditEntry): void {
    // intentionally empty
  },
};
