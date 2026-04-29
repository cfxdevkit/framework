/**
 * `@cfxdevkit/wallet/hardware` — common types & re-exports for hardware
 * wallet adapters.
 *
 * Concrete adapters live in sub-paths so consumers only pay for what they
 * use (e.g. import `@cfxdevkit/wallet/hardware/onekey`).
 *
 * All adapters return the same `Signer` shape from `@cfxdevkit/core`, so they
 * are drop-in replacements for keystore-backed signers.
 */
export type { HardwareWalletAdapter, HardwareWalletKind, RawEvmSignature } from './types.js';
export {
  EVM_DEFAULT_PATH,
  finaliseEip1559Tx,
  rawSignatureToHex,
  toCanonicalHex,
} from './types.js';
