/**
 * `@cfxdevkit/wallet/errors` — wallet/session-key error class.
 */
import { CfxError } from '@cfxdevkit/core';

/**
 * Session-key / signer-factory failures. Codes:
 * - `wallet/session-key/expired`
 * - `wallet/session-key/capability-denied`
 * - `wallet/session-key/revoked`
 * - `wallet/session-key/bad-attestation`
 * - `wallet/signers/readonly`
 */
export class SessionKeyError extends CfxError {}
