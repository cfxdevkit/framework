import { describe, expect, it, vi } from 'vitest';
import { createLedgerHardwareAdapter, type LedgerEthAppLike } from './index.js';

function mockEth(): LedgerEthAppLike {
  return {
    getAddress: vi.fn(async () => ({ address: '0x1234567890123456789012345678901234567890' })),
    signTransaction: vi.fn(async () => ({ r: '11'.repeat(32), s: '22'.repeat(32), v: 1 })),
    signPersonalMessage: vi.fn(async () => ({ r: '11'.repeat(32), s: '22'.repeat(32), v: 27 })),
  };
}

describe('Ledger hardware adapter', () => {
  it('uses the Ledger kind and returns a signer for the requested path', async () => {
    const eth = mockEth();
    const adapter = createLedgerHardwareAdapter({ eth });
    const signer = await adapter.getSigner("m/44'/60'/0'/0/7");

    expect(adapter.kind).toBe('ledger');
    expect(signer.account.address).toBe('0x1234567890123456789012345678901234567890');
    expect(eth.getAddress).toHaveBeenCalledWith("m/44'/60'/0'/0/7", false, false, undefined);
  });
});
