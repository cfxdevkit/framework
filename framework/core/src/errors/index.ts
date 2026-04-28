/**
 * `@cfxdevkit/core/errors` — typed error hierarchy.
 *
 * All framework errors extend {@link CfxError}. Each error carries a stable
 * `code` (kebab-case, namespaced like `core/rpc/timeout`) plus an optional
 * structured `meta` payload. Use {@link isCfxError} as a discriminating
 * type-guard at boundaries.
 */

export interface CfxErrorInit {
  /** Stable, namespaced error code, e.g. `core/rpc/timeout`. */
  code: string;
  /** Human-readable message. */
  message: string;
  /** Underlying cause, if any. Preserved for debugging. */
  cause?: unknown;
  /** Optional structured context (do not put secrets here). */
  meta?: Record<string, unknown>;
}

/** Root of the framework error hierarchy. */
export class CfxError extends Error {
  readonly code: string;
  override readonly cause?: unknown;
  readonly meta?: Record<string, unknown>;

  constructor(init: CfxErrorInit) {
    super(init.message);
    this.name = new.target.name;
    this.code = init.code;
    if (init.cause !== undefined) {
      this.cause = init.cause;
    }
    if (init.meta !== undefined) {
      this.meta = init.meta;
    }
  }

  /** JSON-serialisable representation; safe to log. */
  toJSON(): { name: string; code: string; message: string; meta?: Record<string, unknown> } {
    const out: { name: string; code: string; message: string; meta?: Record<string, unknown> } = {
      name: this.name,
      code: this.code,
      message: this.message,
    };
    if (this.meta !== undefined) {
      out.meta = this.meta;
    }
    return out;
  }
}

/** RPC / transport-layer failures (timeouts, rate-limits, network errors, server 5xx). */
export class RpcError extends CfxError {}

/** Smart-contract failures (revert, decode, gas estimation). */
export class ContractError extends CfxError {}

/** Wallet / signing failures (derivation, user rejection, invalid mnemonic). */
export class WalletError extends CfxError {}

/**
 * Keystore-backend failures (locked vault, missing secret, bad passphrase,
 * unavailable backend, unsupported operation). Codes follow
 * `services/keystore/{locked,not-found,bad-passphrase,backend-unavailable,unsupported}`.
 */
export class KeystoreError extends CfxError {}

/** Type-guard for `CfxError` and any subclass. */
export function isCfxError(value: unknown): value is CfxError {
  return value instanceof CfxError;
}
