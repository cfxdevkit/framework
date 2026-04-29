/**
 * `@cfxdevkit/wallet/session-key` — ephemeral signers with bound capability.
 *
 * A *session key* is a fresh, in-memory keypair scoped by a {@link Capability}
 * (chains, contracts, selectors, value cap, expiry). Production deployments
 * authorise it on-chain by having the *parent* signer sign a delegation
 * (e.g. EIP-7702 / 4337 paymaster, or a custom on-chain registry); this
 * package builds the off-chain primitive — **the client-side proof and the
 * locally-enforced policy wrapper** — and emits an attestation the parent
 * has signed.
 *
 * ```ts
 * const session = await createSessionKey({
 *   parent: rootSigner,                 // hardware / keystore-backed
 *   capability: {
 *     chains: [1030],
 *     contracts: [tokenAddr],
 *     selectors: ['0xa9059cbb'],        // ERC-20 transfer
 *     maxValuePerTx: 0n,
 *     notAfter: Date.now() + 60 * 60_000,
 *   },
 * });
 * // Hand `session.signer` to the agent / dapp; revoke locally with
 * // session.revoke() — every subsequent sign call throws.
 * ```
 *
 * Error codes (`SessionKeyError`):
 * - `wallet/session-key/expired`        — capability `notAfter` passed
 * - `wallet/session-key/revoked`        — `revoke()` called
 * - `wallet/session-key/empty-capability` — `capability` is unconstrained (refused)
 * - inherited `wallet/policies/*`        — capability denial at sign time
 *
 * @remarks
 * - The session key's private material lives **only in this process's
 *   memory** and is wiped on `revoke()`.
 * - The attestation is a sha-256 commitment of the session-key public key
 *   and its capability fields, signed via the parent's `signMessage`. It is
 *   **off-chain by default**; pair it with an on-chain validator for actual
 *   privilege delegation (EIP-7702, 4337 modular accounts, …).
 */
import { randomBytes } from 'node:crypto';
import type { Address, Hex, SignableTx, Signer, SignOptions, TypedData } from '@cfxdevkit/core';
import { signerFromPrivateKey } from '@cfxdevkit/core/wallet';
import type { Capability } from '@cfxdevkit/services/keystore';
import { SessionKeyError } from '../errors/index.js';
import { isEmptyCapability, withCapability } from '../policies/index.js';

export interface CreateSessionKeyInput {
  /** Parent signer that authorises the session (hardware/keystore-backed). */
  parent: Signer;
  /** Constraints applied to every sign call. MUST be non-empty. */
  capability: Capability;
  /**
   * Override the random source (32-byte private key). Used by tests; do not
   * supply in production unless you understand the implications.
   */
  privateKey?: Hex;
  /** Per-call abort signal forwarded to the parent's `signMessage`. */
  signal?: AbortSignal;
}

export interface SessionKey {
  /** Capability-enforcing signer. Use this everywhere instead of the parent. */
  readonly signer: Signer;
  /** Session-key public address (the account `signer.account.address`). */
  readonly address: Address;
  /** Parent address that signed the attestation. */
  readonly parent: Address;
  /** The capability bound to this session. */
  readonly capability: Capability;
  /**
   * Off-chain attestation: parent's signature over a stable digest of
   * `(sessionAddress, capability)`. Pair with an on-chain validator for
   * actual privilege delegation.
   */
  readonly attestation: SessionAttestation;
  /** Wipe the in-memory private key and disable the signer. */
  revoke(): void;
  /** True after `revoke()` or once `capability.notAfter` has passed. */
  readonly isRevoked: boolean;
}

export interface SessionAttestation {
  /** UTF-8 message that the parent signed. Stable, canonical JSON. */
  readonly message: string;
  /** Parent's `signMessage(message)` output. */
  readonly signature: Hex;
  /** sha-256(message) for downstream commit-reveal flows. */
  readonly digest: Hex;
}

/** Mint a session key authorised by `parent` under `capability`. */
export async function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey> {
  const { parent, capability, signal } = input;

  if (isEmptyCapability(capability)) {
    throw new SessionKeyError({
      code: 'wallet/session-key/empty-capability',
      message: 'session keys MUST be constrained by a non-empty Capability',
    });
  }
  if (capability.notAfter !== undefined && capability.notAfter <= Date.now()) {
    throw new SessionKeyError({
      code: 'wallet/session-key/expired',
      message: 'capability.notAfter is in the past',
      meta: { notAfter: String(capability.notAfter) },
    });
  }

  const privateKey = input.privateKey ?? generatePrivateKey();
  const inner = signerFromPrivateKey(privateKey);
  const sessionAddress = inner.account.address;

  const message = canonicalAttestationMessage(sessionAddress, parent.account.address, capability);
  const digest = await sha256Hex(message);
  const signature = await parent.signMessage(message, signal ? { signal } : undefined);

  let revoked = false;
  const guard = (): void => {
    if (revoked) {
      throw new SessionKeyError({
        code: 'wallet/session-key/revoked',
        message: 'session key has been revoked',
      });
    }
    if (capability.notAfter !== undefined && Date.now() > capability.notAfter) {
      revoked = true;
      throw new SessionKeyError({
        code: 'wallet/session-key/expired',
        message: 'session key expired',
        meta: { notAfter: String(capability.notAfter) },
      });
    }
  };

  const policed = withCapability(inner, capability);
  const guarded: Signer = {
    account: policed.account,
    async signTransaction(tx: SignableTx, opts?: SignOptions): Promise<Hex> {
      guard();
      return policed.signTransaction(tx, opts);
    },
    async signMessage(m: string | Uint8Array, opts?: SignOptions): Promise<Hex> {
      guard();
      return policed.signMessage(m, opts);
    },
    async signTypedData(td: TypedData, opts?: SignOptions): Promise<Hex> {
      guard();
      return policed.signTypedData(td, opts);
    },
  };

  return {
    signer: guarded,
    address: sessionAddress,
    parent: parent.account.address,
    capability,
    attestation: { message, signature, digest },
    revoke(): void {
      revoked = true;
    },
    get isRevoked(): boolean {
      if (revoked) return true;
      if (capability.notAfter !== undefined && Date.now() > capability.notAfter) {
        revoked = true;
        return true;
      }
      return false;
    },
  };
}

/**
 * Stable, canonical JSON for the attestation. The byte sequence is what the
 * parent signs and what an on-chain validator must reconstruct.
 */
export function canonicalAttestationMessage(
  sessionAddress: Address,
  parent: Address,
  c: Capability,
): string {
  const ordered: Record<string, unknown> = {
    v: 1,
    type: 'cfxdevkit.session-key.v1',
    parent: parent.toLowerCase(),
    session: sessionAddress.toLowerCase(),
    capability: {
      chains: c.chains ?? null,
      contracts: c.contracts?.map((a) => a.toLowerCase()) ?? null,
      selectors: c.selectors?.map((s) => s.toLowerCase()) ?? null,
      maxValuePerTx: c.maxValuePerTx !== undefined ? c.maxValuePerTx.toString() : null,
      notAfter: c.notAfter ?? null,
    },
  };
  return JSON.stringify(ordered);
}

// ── internals ────────────────────────────────────────────────────────────────

function generatePrivateKey(): Hex {
  // 32 bytes from system CSPRNG. Reject the (negligible) zero result.
  for (let i = 0; i < 4; i++) {
    const buf = randomBytes(32);
    let allZero = true;
    for (let j = 0; j < buf.length; j++) {
      if ((buf[j] ?? 0) !== 0) {
        allZero = false;
        break;
      }
    }
    if (!allZero) return `0x${buf.toString('hex')}` as Hex;
  }
  throw new SessionKeyError({
    code: 'wallet/session-key/expired',
    message: 'CSPRNG returned zero — refusing to mint',
  });
}

async function sha256Hex(input: string): Promise<Hex> {
  const { sha256 } = await import('@noble/hashes/sha256');
  const out = sha256(new TextEncoder().encode(input));
  let hex = '0x';
  for (let i = 0; i < out.length; i++) {
    hex += (out[i] ?? 0).toString(16).padStart(2, '0');
  }
  return hex as Hex;
}
