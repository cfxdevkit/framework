/**
 * OneKey Core Space signer — Conflux-native signing via the OneKey hardware SDK.
 * Path: `m/44'/503'/0'/0/0` (BIP-44 coin 503)
 */
import type { Account, SignableTx, Signer, SignOptions, TypedData } from '@cfxdevkit/cdk';
import { hexToBase32 } from '@cfxdevkit/cdk/address';
import type { Hex } from 'viem';
import { HardwareWalletError } from '../../errors/index.js';
import { toCanonicalHex } from '../types.js';
import {
  computeCip23Hashes,
  normaliseSignature,
  oneKeyError,
  serialiseCoreSignature,
  throwIfAborted,
  toHex,
  toMessageHex,
} from './helpers.js';
import type { OneKeyCoreTxParams, OneKeySdkLike } from './index.js';

/** Default Conflux Core Space BIP-44 derivation path. */
export const CORE_DEFAULT_PATH = "m/44'/503'/0'/0/0" as const;

export interface SignerFromOneKeyCoreInput {
  /** Initialised OneKey SDK instance. */
  sdk: OneKeySdkLike;
  connectId: string;
  deviceId: string;
  /** BIP-44 Core Space path. Defaults to `m/44'/503'/0'/0/0`. */
  path?: string;
  /** Conflux network ID for base32 encoding. Defaults to `1029` (mainnet). */
  networkId?: number;
  showOnDevice?: boolean;
  expectedAddress?: string;
}

/**
 * Build a `Signer` backed by a OneKey device for Conflux **Core Space**.
 *
 * - `account.coreAddress` is the base32 `cfx:` form
 * - `signMessage` → `confluxSignMessage`
 * - `signTypedData` → `confluxSignMessageCIP23` (CIP-23)
 * - `signTransaction` → `confluxSignTransaction` (legacy gas + epochHeight + storageLimit)
 */
export async function signerFromOneKeyCore(input: SignerFromOneKeyCoreInput): Promise<Signer> {
  const {
    sdk,
    connectId,
    deviceId,
    path = CORE_DEFAULT_PATH,
    networkId = 1029,
    showOnDevice = false,
    expectedAddress,
  } = input;

  const addrRes = await sdk.confluxGetAddress(connectId, deviceId, {
    path,
    showOnOneKey: showOnDevice,
    chainId: networkId,
  });
  if (!addrRes.success) throw oneKeyError('wallet/hardware/onekey/device-error', addrRes.payload);

  const hexAddress = toCanonicalHex(addrRes.payload.address) as `0x${string}`;
  const coreAddress = hexToBase32(hexAddress, networkId);

  if (expectedAddress) {
    const norm = (s: string) => s.toLowerCase().replace(/^cfx(test)?:/i, '');
    if (
      norm(coreAddress) !== norm(expectedAddress) &&
      hexAddress.toLowerCase() !== expectedAddress.toLowerCase()
    ) {
      throw new HardwareWalletError({
        code: 'wallet/hardware/address-mismatch',
        message: 'OneKey Core returned an address that does not match expectedAddress',
        meta: { expected: expectedAddress, actual: coreAddress },
      });
    }
  }

  const account: Account = { address: hexAddress, publicKey: '0x' as Hex, coreAddress };

  return {
    account,

    async signTransaction(tx: SignableTx, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      const gasPrice = tx.gasPrice ?? tx.maxFeePerGas;
      if (!gasPrice)
        throw new HardwareWalletError({
          code: 'wallet/hardware/onekey/core-tx-missing-gas',
          message: 'OneKey Core requires gasPrice; EIP-1559 not supported',
        });
      const params: OneKeyCoreTxParams = {
        to: tx.to ?? '0x',
        value: toHex(tx.value ?? 0n),
        ...(tx.data ? { data: tx.data } : {}),
        chainId: Number(tx.chainId ?? networkId),
        nonce: toHex(BigInt(tx.nonce ?? 0)),
        gasLimit: toHex(tx.gas ?? 21_000n),
        gasPrice: toHex(gasPrice),
        epochHeight: '0x0',
        storageLimit: '0x5208',
      };
      const res = await sdk.confluxSignTransaction(connectId, deviceId, {
        path,
        transaction: params,
      });
      if (!res.success) throw oneKeyError('wallet/hardware/onekey/device-error', res.payload);
      return serialiseCoreSignature(res.payload.r, res.payload.s, res.payload.v);
    },

    async signMessage(message: string | Uint8Array, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      const res = await sdk.confluxSignMessage(connectId, deviceId, {
        path,
        messageHex: toMessageHex(message),
      });
      if (!res.success) throw oneKeyError('wallet/hardware/onekey/device-error', res.payload);
      return normaliseSignature(res.payload.signature);
    },

    async signTypedData(typedData: TypedData, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      const { domainHash, messageHash } = computeCip23Hashes(
        typedData as unknown as Parameters<typeof computeCip23Hashes>[0],
      );
      const res = await sdk.confluxSignMessageCIP23(connectId, deviceId, {
        path,
        messageHash,
        domainHash,
      });
      if (!res.success) throw oneKeyError('wallet/hardware/onekey/device-error', res.payload);
      return normaliseSignature(res.payload.signature);
    },
  };
}
