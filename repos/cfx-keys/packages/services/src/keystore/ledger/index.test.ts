import { describe, expect, it, vi } from 'vitest';
import {
  createLedgerKeystore,
  type LedgerEthAppLike,
  type LedgerTransportLike,
  signerFromLedger,
} from './index.js';

const address = '0x1234567890123456789012345678901234567890' as const;
const r = '11'.repeat(32);
const s = '22'.repeat(32);
const corePublicKey =
  '047b88d05ba40b8e6ed961b526ab68c7051d2a8602862c788f84416cc37e9c0a5c4213b20660a6591cd53ad81d5b68499acb835ac7a08c88e18bf8f4998061eb4a';

function mockEth(): LedgerEthAppLike {
  return {
    getAddress: vi.fn(async () => ({ address, publicKey: `0x${'33'.repeat(65)}` })),
    signTransaction: vi.fn(async () => ({ r, s, v: 1 })),
    signPersonalMessage: vi.fn(async () => ({ r, s, v: '1b' })),
    signEIP712Message: vi.fn(async () => ({ r, s, v: 28 })),
  };
}

function mockCoreTransport(): LedgerTransportLike & { calls: Uint8Array[] } {
  const calls: Uint8Array[] = [];
  return {
    calls,
    exchange: vi.fn(async (apdu) => {
      const request = new Uint8Array(apdu);
      calls.push(request);
      const ins = request[1];
      if (ins === 0x01) return hexBytes('030203009000');
      if (ins === 0x02) return hexBytes(`41${corePublicKey}9000`);
      if (ins === 0x03 || ins === 0x04) return hexBytes(`00${r}${s}9000`);
      return hexBytes('6d00');
    }),
  };
}

function hexBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let index = 0; index < out.length; index++) {
    out[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return out;
}

function bytesHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

describe('ledger keystore', () => {
  it('lists configured Ledger accounts as opaque secrets', async () => {
    const provider = createLedgerKeystore({
      eth: mockEth(),
      accounts: [{ ref: { service: 'deploy', account: 'ledger-0' }, path: "m/44'/60'/0'/0/0" }],
    });

    await expect(provider.has({ service: 'deploy', account: 'ledger-0' })).resolves.toBe(true);
    await expect(provider.list({ service: 'deploy' })).resolves.toMatchObject([
      { kind: 'opaque', ref: { service: 'deploy', account: 'ledger-0' } },
    ]);
    expect(provider.capabilities).toEqual({ write: false, list: true, rotate: false });
  });

  it('builds a signer and delegates eSpace operations to the Ledger Ethereum app', async () => {
    const eth = mockEth();
    const provider = createLedgerKeystore({ eth });
    const signer = await provider.getSigner({ service: 'ledger', account: 'espace-0' });

    expect(signer.account.address).toBe(address);
    await expect(signer.signMessage('ledger test')).resolves.toMatch(/^0x[0-9a-f]+$/);
    const raw = await signer.signTransaction({
      chainId: 1030,
      to: address,
      value: 1n,
      nonce: 0,
      gas: 21_000n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000n,
    });
    expect(raw.startsWith('0x02')).toBe(true);
    expect(eth.signTransaction).toHaveBeenCalledWith("m/44'/60'/0'/0/0", expect.any(String), null);
  });

  it('builds a Core signer and delegates message signing to the Conflux Ledger app', async () => {
    const coreTransport = mockCoreTransport();
    const signer = await signerFromLedger({ family: 'core', coreTransport, chainId: 1029 });

    expect(signer.account.coreAddress).toMatch(/^cfx:/);
    await expect(signer.signMessage('Hello, world!')).resolves.toBe(`0x${r}${s}1b`);
    expect(coreTransport.calls[0]?.[1]).toBe(0x01);
    expect(coreTransport.calls[1]?.[1]).toBe(0x02);
    expect(coreTransport.calls[2]?.[1]).toBe(0x04);
  });

  it('falls back to the legacy Core message signing APDU protocol', async () => {
    const calls: Uint8Array[] = [];
    const coreTransport: LedgerTransportLike = {
      exchange: vi.fn(async (apdu) => {
        const request = new Uint8Array(apdu);
        calls.push(request);
        const ins = request[1];
        if (ins === 0x01) return hexBytes('030203009000');
        if (ins === 0x02) return hexBytes(`41${corePublicKey}9000`);
        if (ins === 0x04) return hexBytes('6a86');
        return hexBytes('6d00');
      }),
    };
    const signer = await signerFromLedger({ family: 'core', coreTransport, chainId: 1029 });

    await expect(signer.signMessage('Hello, world!')).rejects.toMatchObject({
      code: 'services/keystore/ledger/core-apdu-error',
    });
    expect(bytesHex(calls[2] ?? new Uint8Array())).toBe(
      'e004008015058000002c800001f7800000000000000000000000',
    );
  });

  it('rejects Core message signing before APDU on unsupported app versions', async () => {
    const calls: Uint8Array[] = [];
    const coreTransport: LedgerTransportLike = {
      exchange: vi.fn(async (apdu) => {
        const request = new Uint8Array(apdu);
        calls.push(request);
        const ins = request[1];
        if (ins === 0x01) return hexBytes('030202029000');
        if (ins === 0x02) return hexBytes(`41${corePublicKey}9000`);
        if (ins === 0x04) throw new Error('message APDU should not be sent');
        return hexBytes('6d00');
      }),
    };
    const signer = await signerFromLedger({ family: 'core', coreTransport, chainId: 1029 });

    await expect(signer.signMessage('Hello, world!')).rejects.toMatchObject({
      code: 'services/keystore/ledger/core-message-unsupported',
      message:
        'Conflux Core Ledger app 2.2.2 does not expose Core message signing in the published app source. Transaction signing still uses the current SIGN_TX APDU flow.',
    });
    expect(calls.map((call) => call[1])).toEqual([0x01, 0x02]);
  });

  it('passes network id when displaying a Core Ledger address', async () => {
    const coreTransport = mockCoreTransport();

    await signerFromLedger({
      family: 'core',
      coreTransport,
      chainId: 1029,
      showAddressOnDevice: true,
    });

    expect(bytesHex(coreTransport.calls[1] ?? new Uint8Array())).toBe(
      'e002010119058000002c800001f780000000000000000000000000000405',
    );
  });

  it('serializes Core transactions and sends them through Ledger APDU signing', async () => {
    const coreTransport = mockCoreTransport();
    const signer = await signerFromLedger({ family: 'core', coreTransport, chainId: 1029 });
    const raw = await signer.signTransaction({
      family: 'core',
      coreType: 'legacy',
      chainId: 1029,
      nonce: 0,
      gas: 21_000n,
      gasPrice: 1n,
      storageLimit: 0n,
      epochHeight: 1n,
    });

    expect(raw).toMatch(/^0x[0-9a-f]+$/);
    expect(coreTransport.calls[2]?.[1]).toBe(0x03);
  });

  it('guards against device address mismatch', async () => {
    await expect(
      signerFromLedger({
        eth: mockEth(),
        expectedAddress: '0x0000000000000000000000000000000000000000',
      }),
    ).rejects.toMatchObject({ code: 'services/keystore/ledger/address-mismatch' });
  });
});
