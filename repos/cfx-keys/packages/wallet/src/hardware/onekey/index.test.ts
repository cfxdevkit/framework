import { hexToBase32 } from '@cfxdevkit/cdk/address';
import { describe, expect, it, vi } from 'vitest';
import { signerFromOneKey, signerFromOneKeyCore } from './index.js';

// A deterministic mock signature (r=1, s=1, v=0) — finalisation just needs valid hex.
const R = `0x${'01'.repeat(32)}`;
const S = `0x${'02'.repeat(32)}`;

function makeSdk(overrides: Partial<Parameters<typeof signerFromOneKey>[0]['sdk']> = {}) {
  const coreHexAddress = '0x1111111111111111111111111111111111111111';
  const coreBase32 = hexToBase32(coreHexAddress, 1);
  return {
    evmGetAddress: vi.fn(async () => ({
      success: true as const,
      payload: {
        address: '0x1111111111111111111111111111111111111111',
        path: "m/44'/60'/0'/0/0",
        publicKey: `0x${'04'.repeat(64)}`,
      },
    })),
    evmSignMessage: vi.fn(async () => ({
      success: true as const,
      payload: { signature: `${R}${S.slice(2)}1b` },
    })),
    evmSignTransaction: vi.fn(async () => ({
      success: true as const,
      payload: { v: '0x0', r: R, s: S },
    })),
    evmSignTypedData: vi.fn(async () => ({
      success: true as const,
      payload: { signature: `${R}${S.slice(2)}1c` },
    })),
    confluxGetAddress: vi.fn(async () => ({
      success: true as const,
      payload: {
        address: coreBase32,
        path: "m/44'/503'/0'/0/0",
      },
    })),
    confluxSignMessage: vi.fn(async () => ({
      success: true as const,
      payload: { signature: `${R}${S.slice(2)}1b`, address: coreHexAddress },
    })),
    confluxSignMessageCIP23: vi.fn(async () => ({
      success: true as const,
      payload: { signature: `${R}${S.slice(2)}1b`, address: coreHexAddress },
    })),
    confluxSignTransaction: vi.fn(async () => ({
      success: true as const,
      payload: { v: '0x0', r: R, s: S },
    })),
    ...overrides,
  };
}

describe('signerFromOneKey', () => {
  it('builds a signer with the device-reported address', async () => {
    const sdk = makeSdk();
    const signer = await signerFromOneKey({ sdk, connectId: 'C', deviceId: 'D' });
    expect(signer.account.address).toBe('0x1111111111111111111111111111111111111111');
    expect(sdk.evmGetAddress).toHaveBeenCalledWith(
      'C',
      'D',
      expect.objectContaining({
        path: "m/44'/60'/0'/0/0",
        showOnOneKey: false,
      }),
    );
  });

  it('rejects when device address differs from expectedAddress', async () => {
    const sdk = makeSdk();
    await expect(
      signerFromOneKey({
        sdk,
        connectId: 'C',
        deviceId: 'D',
        expectedAddress: '0x2222222222222222222222222222222222222222',
      }),
    ).rejects.toMatchObject({ code: 'wallet/hardware/address-mismatch' });
  });

  it('signMessage returns a 65-byte hex signature', async () => {
    const sdk = makeSdk();
    const signer = await signerFromOneKey({ sdk, connectId: 'C', deviceId: 'D' });
    const sig = await signer.signMessage('hello');
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
    const call = sdk.evmSignMessage.mock.calls[0]?.[2];
    expect(call?.messageHex).toBe(`0x${Buffer.from('hello').toString('hex')}`);
  });

  it('signTransaction serialises an EIP-1559 raw tx', async () => {
    const sdk = makeSdk();
    const signer = await signerFromOneKey({ sdk, connectId: 'C', deviceId: 'D' });
    const raw = await signer.signTransaction({
      chainId: 1030,
      to: '0x3333333333333333333333333333333333333333',
      value: 1n,
      nonce: 0,
      gas: 21_000n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
    });
    expect(raw).toMatch(/^0x02[0-9a-f]+$/); // EIP-1559 prefix byte 0x02
  });

  it('rejects legacy transactions (no fee fields)', async () => {
    const sdk = makeSdk();
    const signer = await signerFromOneKey({ sdk, connectId: 'C', deviceId: 'D' });
    await expect(
      signer.signTransaction({ chainId: 1, to: '0x33'.padEnd(42, '0') as `0x${string}` }),
    ).rejects.toMatchObject({ code: 'wallet/hardware/unsupported-tx-type' });
  });

  it('propagates SDK errors as HardwareWalletError', async () => {
    const sdk = makeSdk({
      evmGetAddress: vi.fn(async () => ({
        success: false as const,
        payload: { error: 'user cancelled' },
      })),
    });
    await expect(signerFromOneKey({ sdk, connectId: 'C', deviceId: 'D' })).rejects.toMatchObject({
      code: 'wallet/hardware/onekey/device-error',
    });
  });

  it('accepts Core address responses in base32 format', async () => {
    const sdk = makeSdk();
    const signer = await signerFromOneKeyCore({
      sdk,
      connectId: 'C',
      deviceId: 'D',
      networkId: 1,
    });
    expect(signer.account.address).toBe('0x1111111111111111111111111111111111111111');
    expect(signer.account.coreAddress?.startsWith('cfxtest:')).toBe(true);
  });

  it('accepts eSpace address responses in base32 format', async () => {
    const sdk = makeSdk({
      evmGetAddress: vi.fn(async () => ({
        success: true as const,
        payload: {
          address: hexToBase32('0x1111111111111111111111111111111111111111', 1),
          path: "m/44'/60'/0'/0/0",
          publicKey: `0x${'04'.repeat(64)}`,
        },
      })),
    });

    const signer = await signerFromOneKey({ sdk, connectId: 'C', deviceId: 'D' });
    expect(signer.account.address).toBe('0x1111111111111111111111111111111111111111');
  });

  it('fills EIP712Domain for eSpace signTypedData when omitted', async () => {
    const sdk = makeSdk();
    const signer = await signerFromOneKey({ sdk, connectId: 'C', deviceId: 'D' });

    await signer.signTypedData({
      domain: { name: 'Conflux Showcase', version: '1', chainId: 71 },
      types: {
        SignIn: [
          { name: 'message', type: 'string' },
          { name: 'nonce', type: 'string' },
        ],
      },
      primaryType: 'SignIn',
      message: { message: 'hello', nonce: '1' },
    } as never);

    const call = sdk.evmSignTypedData.mock.calls[0]?.[2];
    expect(call?.data?.types?.EIP712Domain).toEqual([
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
    ]);
    expect(call?.data?.types?.CIP23Domain).toEqual(call?.data?.types?.EIP712Domain);
  });

  it('fills EIP712Domain for core CIP-23 signTypedData when omitted', async () => {
    const sdk = makeSdk();
    const signer = await signerFromOneKeyCore({
      sdk,
      connectId: 'C',
      deviceId: 'D',
      networkId: 1,
    });

    const sig = await signer.signTypedData({
      domain: { name: 'Conflux Core Showcase', version: '1', chainId: 1 },
      types: {
        SignIn: [
          { name: 'message', type: 'string' },
          { name: 'nonce', type: 'string' },
        ],
      },
      primaryType: 'SignIn',
      message: { message: 'hello', nonce: '1' },
    } as never);

    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
    expect(sdk.confluxSignMessageCIP23).toHaveBeenCalledTimes(1);
  });
});
