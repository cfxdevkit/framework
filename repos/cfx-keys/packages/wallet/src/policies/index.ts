/**
 * `@cfxdevkit/wallet/policies` — capability-enforcing Signer wrapper.
 *
 * Wraps any {@link Signer} with a {@link Capability} and rejects sign calls
 * that would violate the policy. Backends that *natively* enforce
 * capabilities (e.g. an HSM session key) should still wrap with this for
 * defence in depth — denial happens before the secret is even consulted.
 *
 * ```ts
 * const scoped = withCapability(rootSigner, {
 *   chains: [1030],
 *   contracts: ['0x…'],
 *   selectors: ['0xa9059cbb'], // ERC-20 transfer
 *   maxValuePerTx: 0n,
 *   notAfter: Date.now() + 60 * 60_000,
 * });
 * await scoped.signTransaction(tx); // throws SessionKeyError if tx violates
 * ```
 *
 * Error codes (all `SessionKeyError`):
 * - `wallet/policies/expired`            — `notAfter` already in the past
 * - `wallet/policies/chain-denied`       — `tx.chainId ∉ capability.chains`
 * - `wallet/policies/contract-denied`    — `tx.to ∉ capability.contracts`
 * - `wallet/policies/selector-denied`    — `tx.data[0..4] ∉ capability.selectors`
 * - `wallet/policies/value-exceeded`     — `tx.value > capability.maxValuePerTx`
 * - `wallet/policies/missing-target`     — contract policy set but `tx.to` absent
 * - `wallet/policies/missing-selector`   — selector policy set but `tx.data` < 4 bytes
 * - `wallet/policies/typed-data-chain-denied` — typed-data `domain.chainId` blocked
 */
import type { Address, Hex, SignableTx, Signer, SignOptions, TypedData } from '@cfxdevkit/core';
import type { Capability } from '@cfxdevkit/services/keystore';
import { SessionKeyError } from '../errors/index.js';

/**
 * Wrap a {@link Signer} so every sign call is validated against `capability`.
 * If `capability` is `undefined` or empty, the inner signer is returned
 * unchanged (no overhead).
 */
export function withCapability(inner: Signer, capability?: Capability): Signer {
  if (!capability || isEmptyCapability(capability)) return inner;
  const cap = capability;

  return {
    account: inner.account,
    async signTransaction(tx: SignableTx, opts?: SignOptions): Promise<Hex> {
      checkExpiry(cap);
      checkChain(cap, tx.chainId);
      checkContract(cap, tx.to as Address | undefined);
      checkSelector(cap, tx.data);
      checkValue(cap, tx.value);
      return inner.signTransaction(tx, opts);
    },
    async signMessage(message: string | Uint8Array, opts?: SignOptions): Promise<Hex> {
      checkExpiry(cap);
      return inner.signMessage(message, opts);
    },
    async signTypedData(typedData: TypedData, opts?: SignOptions): Promise<Hex> {
      checkExpiry(cap);
      const domainChain = (typedData.domain as { chainId?: number | bigint } | undefined)?.chainId;
      if (domainChain !== undefined && cap.chains?.length) {
        const cid = typeof domainChain === 'bigint' ? Number(domainChain) : domainChain;
        if (!cap.chains.includes(cid)) {
          throw deny('typed-data-chain-denied', { chainId: String(cid) });
        }
      }
      return inner.signTypedData(typedData, opts);
    },
  };
}

/**
 * Standalone validator. Returns `null` if the transaction is allowed,
 * otherwise the {@link SessionKeyError} that `withCapability` would throw.
 * Useful for dry-runs (UI confirmation, batched-tx pre-check).
 */
export function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null {
  try {
    checkExpiry(capability);
    checkChain(capability, tx.chainId);
    checkContract(capability, tx.to as Address | undefined);
    checkSelector(capability, tx.data);
    checkValue(capability, tx.value);
    return null;
  } catch (err) {
    return err instanceof SessionKeyError ? err : null;
  }
}

/** True iff the capability constrains nothing. */
export function isEmptyCapability(c: Capability): boolean {
  return (
    !c.chains?.length &&
    !c.contracts?.length &&
    !c.selectors?.length &&
    c.maxValuePerTx === undefined &&
    c.notAfter === undefined
  );
}

// ── internals ────────────────────────────────────────────────────────────────

function checkExpiry(c: Capability): void {
  if (c.notAfter !== undefined && Date.now() > c.notAfter) {
    throw deny('expired', { notAfter: String(c.notAfter) });
  }
}

function checkChain(c: Capability, chainId: number): void {
  if (!c.chains?.length) return;
  if (!c.chains.includes(chainId)) {
    throw deny('chain-denied', { chainId: String(chainId) });
  }
}

function checkContract(c: Capability, to: Address | undefined): void {
  if (!c.contracts?.length) return;
  if (!to) throw deny('missing-target', {});
  const target = to.toLowerCase();
  const allowed = c.contracts.some((a) => a.toLowerCase() === target);
  if (!allowed) throw deny('contract-denied', { to });
}

function checkSelector(c: Capability, data: Hex | undefined): void {
  if (!c.selectors?.length) return;
  if (!data || data.length < 10) throw deny('missing-selector', {});
  const sel = data.slice(0, 10).toLowerCase() as Hex;
  const allowed = c.selectors.some((s) => s.toLowerCase() === sel);
  if (!allowed) throw deny('selector-denied', { selector: sel });
}

function checkValue(c: Capability, value: bigint | undefined): void {
  if (c.maxValuePerTx === undefined) return;
  const v = value ?? 0n;
  if (v > c.maxValuePerTx) {
    throw deny('value-exceeded', { value: String(v), max: String(c.maxValuePerTx) });
  }
}

function deny(
  reason:
    | 'expired'
    | 'chain-denied'
    | 'contract-denied'
    | 'selector-denied'
    | 'value-exceeded'
    | 'missing-target'
    | 'missing-selector'
    | 'typed-data-chain-denied',
  meta: Record<string, string>,
): SessionKeyError {
  return new SessionKeyError({
    code: `wallet/policies/${reason}`,
    message: `capability check failed: ${reason}`,
    ...(Object.keys(meta).length > 0 ? { meta } : {}),
  });
}
