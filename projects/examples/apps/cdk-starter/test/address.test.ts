import { describe, expect, it } from 'vitest';
import { hexToBase32, base32ToHex, isBase32Address, getCoreAddress } from '@cfxdevkit/cdk/address';

describe('address', () => {
  const TEST_HEX = '0x08f1d158019e76d6e0c26609c384301331204377';

  it('hexToBase32 converts to Conflux base32 format', () => {
    const mainnet = hexToBase32(TEST_HEX, 1029);
    expect(mainnet).toMatch(/^cfx:/);
    expect(isBase32Address(mainnet)).toBe(true);

    const testnet = hexToBase32(TEST_HEX, 1);
    expect(testnet).toMatch(/^cfxtest:/);
    expect(isBase32Address(testnet)).toBe(true);
  });

  it('base32ToHex converts back to hex', () => {
    const base32 = hexToBase32(TEST_HEX, 1029);
    const hex = base32ToHex(base32);
    expect(hex.toLowerCase()).toBe(TEST_HEX.toLowerCase());
  });

  it('round-trips for testnet', () => {
    const base32 = hexToBase32(TEST_HEX, 1);
    const hex = base32ToHex(base32);
    expect(hex.toLowerCase()).toBe(TEST_HEX.toLowerCase());
  });

  it('isBase32Address rejects invalid input', () => {
    expect(isBase32Address('0x08f1d158019e76d6e0c26609c384301331204377')).toBe(false);
    expect(isBase32Address('notanaddress')).toBe(false);
  });

  it('getCoreAddress normalises base32 addresses', () => {
    const base32 = hexToBase32(TEST_HEX, 1029);
    const normalised = getCoreAddress(base32);
    expect(normalised).toBe(base32);
  });
});
