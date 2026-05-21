/**
 * `@cfxdevkit/contracts/errors` — error codes raised by the contracts surface.
 *
 * All errors derive from `CfxError` (re-exported from `@cfxdevkit/cdk`) and
 * carry a stable string `code` so callers can branch without parsing messages.
 */
import { CfxError, type CfxErrorInit } from '@cfxdevkit/cdk';

export type ContractsErrorCode =
  /** The supplied chain family is not yet supported by this surface. */
  | 'contracts/unsupported-family'
  /** Encoded data could not be decoded against the supplied ABI. */
  | 'contracts/decode-failure'
  /** A write/deploy operation produced a transaction but no receipt within the timeout. */
  | 'contracts/receipt-timeout'
  /** Receipt status was `reverted`. */
  | 'contracts/reverted'
  /** A required argument was missing or malformed. */
  | 'contracts/invalid-argument';

export class ContractsError extends CfxError {
  constructor(init: CfxErrorInit & { code: ContractsErrorCode }) {
    super(init);
    this.name = 'ContractsError';
  }
}
