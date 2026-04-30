import { describe, expect, it } from 'vitest';
import { getRecordedCalls, makeMockClient, makeMockSigner } from '../test/mocks.js';
import {
  CROSS_SPACE_CALL_HEX,
  callEspace,
  getMappedBalance,
  hexToUint256,
  mappedEspaceAddress,
  transferToEspace,
  uint256Hex,
  withdrawFromMapped,
} from './index.js';

const ESPACE_ADDR = '0x000000000000000000000000000000000000c0de';
const CORE_HEX = '0x1a2f80341409639ea6a35bbcab8299066109aa55';

const CORE_RPC_OK = {
  cfx_getNextNonce: '0x5',
  cfx_estimateGasAndCollateral: { gasLimit: '0x186a0', storageCollateralized: '0x40' },
  cfx_gasPrice: '0x3b9aca00',
  cfx_epochNumber: '0x100',
  cfx_sendRawTransaction: '0xbridgehash',
} as const;

describe('bridge.mappedEspaceAddress', () => {
  it('derives the eSpace mapped address as keccak256(coreHex)[12:32]', () => {
    const mapped = mappedEspaceAddress(CORE_HEX);
    // Sanity: 20-byte hex.
    expect(mapped).toMatch(/^0x[0-9a-f]{40}$/);
    // Stable for a given input.
    expect(mappedEspaceAddress(CORE_HEX)).toBe(mapped);
    // Different Core addresses map to different eSpace addresses.
    expect(mappedEspaceAddress('0x0000000000000000000000000000000000000001')).not.toBe(mapped);
  });

  it('rejects malformed Core hex inputs', () => {
    expect(() => mappedEspaceAddress('0xabc' as `0x${string}`)).toThrow(/20-byte/);
  });
});

describe('bridge.transferToEspace', () => {
  it('encodes transferEVM(to) with value and broadcasts via cfx_sendRawTransaction', async () => {
    const client = makeMockClient({ family: 'core', chainId: 1, rpc: { ...CORE_RPC_OK } });
    const signer = makeMockSigner({ coreAddress: 'cfxtest:aaa…sender' });

    const result = await transferToEspace({
      client,
      signer,
      to: ESPACE_ADDR,
      value: 1_000_000_000_000_000_000n,
    });

    expect(result.hash).toBe('0xbridgehash');
    const signed = signer.history[0];
    expect(signed?.family).toBe('core');
    // CrossSpaceCall is the recipient — base32 form encoded against networkId 1.
    expect(typeof signed?.to).toBe('string');
    expect(String(signed?.to).startsWith('cfxtest:')).toBe(true);
    // transferEVM selector (first 4 bytes of keccak256("transferEVM(bytes20)")).
    expect(signed?.data?.slice(0, 10)).toBe('0xda8d5daf');
    expect(signed?.value).toBe(1_000_000_000_000_000_000n);

    const methods = getRecordedCalls(client).map((c) => c.method);
    expect(methods).toContain('cfx_sendRawTransaction');
  });

  it('throws on a non-Core client', async () => {
    const client = makeMockClient({ rpc: {} });
    const signer = makeMockSigner();
    await expect(transferToEspace({ client, signer, to: ESPACE_ADDR, value: 1n })).rejects.toThrow(
      /Core Space/,
    );
  });

  it('rejects an invalid eSpace address', async () => {
    const client = makeMockClient({ family: 'core', chainId: 1, rpc: { ...CORE_RPC_OK } });
    const signer = makeMockSigner({ coreAddress: 'cfxtest:aaa…sender' });
    await expect(
      transferToEspace({ client, signer, to: 'cfxtest:nothex', value: 1n }),
    ).rejects.toThrow(/0x-prefixed/);
  });
});

describe('bridge.callEspace', () => {
  it('encodes callEVM(to, data) and forwards value', async () => {
    const client = makeMockClient({ family: 'core', chainId: 1029, rpc: { ...CORE_RPC_OK } });
    const signer = makeMockSigner({ coreAddress: 'cfx:aaa…sender' });

    await callEspace({
      client,
      signer,
      to: ESPACE_ADDR,
      data: '0xa9059cbb',
      value: 0n,
    });

    const signed = signer.history[0];
    // callEVM selector.
    expect(signed?.data?.slice(0, 10)).toBe('0xbea05ee3');
    // Mainnet base32 prefix.
    expect(String(signed?.to).startsWith('cfx:')).toBe(true);
  });
});

describe('bridge.withdrawFromMapped', () => {
  it('encodes withdrawFromMapped(value) and broadcasts', async () => {
    const client = makeMockClient({ family: 'core', chainId: 1, rpc: { ...CORE_RPC_OK } });
    const signer = makeMockSigner({ coreAddress: 'cfxtest:aaa…sender' });

    await withdrawFromMapped({ client, signer, value: 42n });
    const signed = signer.history[0];
    // withdrawFromMapped selector.
    expect(signed?.data?.slice(0, 10)).toBe('0xc23ef031');
  });
});

describe('bridge.getMappedBalance', () => {
  it('issues cfx_call against the CrossSpaceCall contract', async () => {
    const client = makeMockClient({
      family: 'core',
      chainId: 1,
      rpc: {
        cfx_call: '0x000000000000000000000000000000000000000000000000000000000000007b', // 123
      },
    });
    const balance = await getMappedBalance({ client, coreHexAddress: CORE_HEX });
    expect(balance).toBe(123n);
    expect(getRecordedCalls(client)[0]?.method).toBe('cfx_call');
  });
});

describe('bridge utility helpers', () => {
  it('uint256Hex round-trips with hexToUint256', () => {
    const enc = uint256Hex(7n);
    expect(enc).toBe('0x0000000000000000000000000000000000000000000000000000000000000007');
    expect(hexToUint256(enc)).toBe(7n);
  });

  it('exposes the canonical CrossSpaceCall hex address', () => {
    expect(CROSS_SPACE_CALL_HEX).toBe('0x0888000000000000000000000000000000000006');
  });
});
