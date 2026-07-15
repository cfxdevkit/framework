/**
 * `@cfxdevkit/wallet/hardware/onekey` — OneKey hardware-wallet adapter.
 *
 * The `@onekeyfe/hd-common-connect-sdk` package is **injected** rather than imported
 * so this package does not pull a heavy peer that the consumer may already have
 * configured for their own runtime (Node, web, React Native, …).
 *
 * Two signer factories are available:
 *
 * **eSpace (EVM-compatible):**
 * ```ts
 * import HardwareSDK from '@onekeyfe/hd-common-connect-sdk';
 * await HardwareSDK.init({ env: 'webusb', debug: false });
 * const signer = await signerFromOneKey({ sdk: HardwareSDK, connectId, deviceId, chainId: 1030 });
 * ```
 *
 * **Core Space (Conflux-native):**
 * ```ts
 * const coreSigner = await signerFromOneKeyCore({ sdk: HardwareSDK, connectId, deviceId, networkId: 1029 });
 * // signer.account.coreAddress → 'cfx:…'
 * ```
 *
 * Both conforms to the OneKey SDK API surface at https://developer.onekey.so:
 * - EVM: `evmGetAddress`, `evmSignMessage`, `evmSignTransaction`, `evmSignTypedData`
 * - Core: `confluxGetAddress`, `confluxSignMessage`, `confluxSignMessageCIP23`, `confluxSignTransaction`
 */
import type { Account, SignableTx, Signer, SignOptions, TypedData } from '@cfxdevkit/cdk';
import { base32ToHex, isBase32Address } from '@cfxdevkit/cdk/address';
import type { Hex, TransactionSerializableEIP1559 } from 'viem';
import { HardwareWalletError } from '../../errors/index.js';
import { EVM_DEFAULT_PATH, finaliseEip1559Tx, toCanonicalHex } from '../types.js';
import {
  normaliseSignature,
  normaliseTypedData,
  oneKeyError,
  parseV,
  throwIfAborted,
  toHex,
  toMessageHex,
  withOneKeyInitRetry,
} from './helpers.js';

/** Subset of the OneKey SDK we depend on. */
export interface OneKeySdkLike {
  cancel?(connectId?: string): void;

  // ── eSpace (EVM) ──────────────────────────────────────────────────────────
  evmGetAddress(
    connectId: string,
    deviceId: string,
    params: { path: string; showOnOneKey?: boolean; chainId?: number },
  ): Promise<OneKeyResponse<{ address: string; path: string; publicKey?: string }>>;

  evmSignMessage(
    connectId: string,
    deviceId: string,
    params: { path: string; messageHex: string; chainId?: number },
  ): Promise<OneKeyResponse<{ signature: string; address?: string }>>;

  evmSignTransaction(
    connectId: string,
    deviceId: string,
    params: { path: string; transaction: OneKeyTxParams },
  ): Promise<OneKeyResponse<{ v: string; r: string; s: string }>>;

  evmSignTypedData(
    connectId: string,
    deviceId: string,
    params: {
      path: string;
      data: unknown;
      metamaskV4Compat?: boolean;
      chainId?: number;
    },
  ): Promise<OneKeyResponse<{ signature: string; address?: string }>>;

  // ── Core Space (Conflux-native, BIP44 coin 503) ───────────────────────────
  /** Get Conflux Core Space address at the given BIP-44 path (default `m/44'/503'/0'/0/0`). */
  confluxGetAddress(
    connectId: string,
    deviceId: string,
    params: { path: string; showOnOneKey?: boolean; chainId?: number },
  ): Promise<OneKeyResponse<{ address: string; path: string }>>;

  /** Sign a raw hex message using the Conflux Core personal_sign convention. */
  confluxSignMessage(
    connectId: string,
    deviceId: string,
    params: { path: string; messageHex: string },
  ): Promise<OneKeyResponse<{ signature: string; address: string }>>;

  /**
   * Sign a CIP-23 structured typed-data message (Conflux Core equivalent of EIP-712).
   * @see https://github.com/Conflux-Chain/CIPs/blob/master/CIPs/cip-23.md
   */
  confluxSignMessageCIP23(
    connectId: string,
    deviceId: string,
    params: { path: string; messageHash: string; domainHash: string },
  ): Promise<OneKeyResponse<{ signature: string; address: string }>>;

  /** Sign a Conflux Core Space transaction (legacy gas, epochHeight, storageLimit). */
  confluxSignTransaction(
    connectId: string,
    deviceId: string,
    params: { path: string; transaction: OneKeyCoreTxParams },
  ): Promise<OneKeyResponse<{ v: string; r: string; s: string }>>;
}

/** OneKey responses are tagged unions: success → payload, failure → error. */
export type OneKeyResponse<T> =
  | { success: true; payload: T }
  | { success: false; payload: { error: string; code?: string | number } };

/** Tx fields OneKey expects (all numbers as 0x-hex strings). */
export interface OneKeyTxParams {
  to: string;
  value: string;
  data?: string;
  chainId: number;
  nonce: string;
  gasLimit: string;
  // Legacy
  gasPrice?: string;
  // EIP-1559
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/** Tx fields for Conflux Core Space — legacy gas + Conflux-specific fields. */
export interface OneKeyCoreTxParams {
  to: string;
  value: string;
  data?: string;
  chainId: number;
  nonce: string;
  gasLimit: string;
  gasPrice: string;
  /** Conflux-specific: epoch height for transaction expiry. Defaults to '0x0'. */
  epochHeight: string;
  /** Conflux-specific: storage collateral limit in drips. Defaults to '0x5208'. */
  storageLimit: string;
}

export interface SignerFromOneKeyInput {
  /** Initialised OneKey SDK instance. */
  sdk: OneKeySdkLike;
  /** Device connect identifier (returned by `searchDevices`). */
  connectId: string;
  /** Device unique identifier. */
  deviceId: string;
  /** BIP-44 path. Defaults to `m/44'/60'/0'/0/0`. */
  path?: string;
  /** Default chain id for typed-data and personal_sign. */
  chainId?: number;
  /** If set, refuse to construct the signer when the device returns a
   *  different address than expected (defends against device-swap). */
  expectedAddress?: `0x${string}`;
  /** Show address on device during initial fetch. Default `false`. */
  showOnDevice?: boolean;
}

/** Build a `Signer` backed by a OneKey hardware device. */
export async function signerFromOneKey(input: SignerFromOneKeyInput): Promise<Signer> {
  const {
    sdk,
    connectId,
    deviceId,
    path = EVM_DEFAULT_PATH,
    chainId,
    expectedAddress,
    showOnDevice = false,
  } = input;

  const addrRes = await withOneKeyInitRetry(() =>
    sdk.evmGetAddress(connectId, deviceId, {
      path,
      showOnOneKey: showOnDevice,
      ...(chainId !== undefined ? { chainId } : {}),
    }),
  );
  if (!addrRes.success) {
    throw oneKeyError('wallet/hardware/onekey/device-error', addrRes.payload);
  }
  const rawAddress = addrRes.payload.address;
  const address = (
    isBase32Address(rawAddress)
      ? base32ToHex(rawAddress, { strict: false })
      : toCanonicalHex(rawAddress)
  ) as `0x${string}`;
  const publicKey = (
    addrRes.payload.publicKey ? toCanonicalHex(addrRes.payload.publicKey) : ('0x' as Hex)
  ) as `0x${string}`;
  if (expectedAddress && address.toLowerCase() !== expectedAddress.toLowerCase()) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/address-mismatch',
      message: 'OneKey returned an address that does not match expectedAddress',
      meta: { expected: expectedAddress, actual: address },
    });
  }

  const account: Account = { address, publicKey };

  return {
    account,

    async signTransaction(tx: SignableTx, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      if (tx.maxFeePerGas === undefined || tx.maxPriorityFeePerGas === undefined) {
        throw new HardwareWalletError({
          code: 'wallet/hardware/unsupported-tx-type',
          message: 'OneKey adapter currently only signs EIP-1559 transactions',
        });
      }
      const eip1559: TransactionSerializableEIP1559 = {
        type: 'eip1559',
        chainId: Number(tx.chainId),
        ...(tx.to !== undefined ? { to: tx.to as `0x${string}` } : {}),
        ...(tx.value !== undefined ? { value: tx.value } : {}),
        ...(tx.data !== undefined ? { data: tx.data } : {}),
        ...(tx.nonce !== undefined ? { nonce: tx.nonce } : {}),
        ...(tx.gas !== undefined ? { gas: tx.gas } : {}),
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      };

      const params: OneKeyTxParams = {
        to: tx.to ?? '0x',
        value: toHex(tx.value ?? 0n),
        ...(tx.data !== undefined ? { data: tx.data } : {}),
        chainId: Number(tx.chainId),
        nonce: toHex(BigInt(tx.nonce ?? 0)),
        gasLimit: toHex(tx.gas ?? 21_000n),
        maxFeePerGas: toHex(tx.maxFeePerGas),
        maxPriorityFeePerGas: toHex(tx.maxPriorityFeePerGas),
      };
      const res = await sdk.evmSignTransaction(connectId, deviceId, {
        path,
        transaction: params,
      });
      if (!res.success) throw oneKeyError('wallet/hardware/onekey/device-error', res.payload);

      return finaliseEip1559Tx(eip1559, {
        r: toCanonicalHex(res.payload.r),
        s: toCanonicalHex(res.payload.s),
        v: parseV(res.payload.v),
      });
    },

    async signMessage(message: string | Uint8Array, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      const messageHex = toMessageHex(message);
      const res = await sdk.evmSignMessage(connectId, deviceId, {
        path,
        messageHex,
        ...(chainId !== undefined ? { chainId } : {}),
      });
      if (!res.success) throw oneKeyError('wallet/hardware/onekey/device-error', res.payload);
      return normaliseSignature(res.payload.signature);
    },

    async signTypedData(typedData: TypedData, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      const normalisedTypedData = normaliseTypedData(typedData);
      const res = await sdk.evmSignTypedData(connectId, deviceId, {
        path,
        data: normalisedTypedData,
        metamaskV4Compat: true,
        ...(chainId !== undefined ? { chainId } : {}),
      });
      if (!res.success) throw oneKeyError('wallet/hardware/onekey/device-error', res.payload);
      return normaliseSignature(res.payload.signature);
    },
  };
}

export type { SignerFromOneKeyCoreInput } from './core.js';
export { CORE_DEFAULT_PATH, signerFromOneKeyCore } from './core.js';
