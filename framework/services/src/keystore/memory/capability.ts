/**
 * Capability enforcement wrapper. Wraps a base `Signer` so that
 * `signTransaction` rejects calls that violate the configured policy.
 *
 * Note: `signMessage` and `signTypedData` are delegated unchanged — the
 * capability model in `services/keystore` only constrains transactions.
 */

import type { Signer } from '@cfxdevkit/core';
import { KeystoreError } from '@cfxdevkit/core';
import type { SignableTx } from '@cfxdevkit/core/wallet';
import type { Capability } from '../index.js';

export function applyCapability(base: Signer, capability: Capability): Signer {
  return {
    account: base.account,
    signMessage: (m, opts) => base.signMessage(m, opts),
    signTypedData: (td, opts) => base.signTypedData(td, opts),
    async signTransaction(tx: SignableTx, opts) {
      assertCapability(tx, capability);
      return base.signTransaction(tx, opts);
    },
  };
}

function assertCapability(tx: SignableTx, cap: Capability): void {
  if (cap.notAfter !== undefined && Date.now() > cap.notAfter) {
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: 'capability expired',
      meta: { notAfter: cap.notAfter, now: Date.now() },
    });
  }
  if (cap.chains && !cap.chains.includes(tx.chainId)) {
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: `chainId ${tx.chainId} not permitted by capability`,
      meta: { chainId: tx.chainId, allowed: cap.chains },
    });
  }
  if (cap.contracts && tx.to !== undefined) {
    const target = tx.to.toLowerCase();
    const allowed = cap.contracts.map((a) => a.toLowerCase());
    if (!allowed.includes(target)) {
      throw new KeystoreError({
        code: 'services/keystore/unsupported',
        message: `target ${tx.to} not permitted by capability`,
        meta: { to: tx.to },
      });
    }
  }
  if (cap.selectors && tx.data && tx.data.length >= 10) {
    const sel = tx.data.slice(0, 10).toLowerCase();
    const allowed = cap.selectors.map((s) => s.toLowerCase());
    if (!allowed.includes(sel)) {
      throw new KeystoreError({
        code: 'services/keystore/unsupported',
        message: `selector ${sel} not permitted by capability`,
        meta: { selector: sel },
      });
    }
  }
  if (cap.maxValuePerTx !== undefined && tx.value !== undefined && tx.value > cap.maxValuePerTx) {
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: `tx value ${tx.value} exceeds capability max ${cap.maxValuePerTx}`,
      meta: { value: tx.value.toString(), max: cap.maxValuePerTx.toString() },
    });
  }
}
