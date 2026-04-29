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

/**
 * Hardware-wallet adapter failures. Codes (vendor-prefixed):
 * - `wallet/hardware/onekey/{init-failed,user-cancelled,device-error,bad-response}`
 * - `wallet/hardware/satochip/{bridge-unreachable,no-card,bad-pin,bad-response}`
 * - `wallet/hardware/{unsupported-tx-type,address-mismatch,aborted}`
 */
export class HardwareWalletError extends CfxError {}
