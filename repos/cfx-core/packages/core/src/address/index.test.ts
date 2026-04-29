import { describe, expect, it } from 'vitest';
import { base32ToHex, getCoreAddress, hexToBase32, isBase32Address } from './index.js';

// Known Conflux mainnet vector (networkId 1029):
//   hex   0x1a2f80341409639ea6a35bbcab8299066109aa55
//   base32 cfx:aarc9abycue0hhzgyrr53m6cxedgccrmmyybjgh4xg
const HEX = '0x1a2f80341409639ea6a35bbcab8299066109aa55' as const;
const BASE32 = 'cfx:aarc9abycue0hhzgyrr53m6cxedgccrmmyybjgh4xg';
const VERBOSE = 'CFX:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMYYBJGH4XG';

describe('address', () => {
  it('hexToBase32 matches the known mainnet vector', () => {
    expect(hexToBase32(HEX, 1029)).toBe(BASE32);
  });

  it('base32ToHex round-trips', () => {
    expect(base32ToHex(BASE32).toLowerCase()).toBe(HEX);
  });

  it('isBase32Address recognises a valid base32 address', () => {
    expect(isBase32Address(BASE32)).toBe(true);
    expect(isBase32Address(HEX)).toBe(false);
    expect(isBase32Address('not-an-address')).toBe(false);
  });

  it('getCoreAddress accepts the verbose uppercase form', () => {
    // cive's getAddress requires uniform case. Verbose form is fully
    // upper-cased and includes the type segment.
    expect(getCoreAddress(VERBOSE)).toBe(VERBOSE);
  });

  it('hexToBase32 with networkId=1 produces a cfxtest: prefix', () => {
    const testnet = hexToBase32(HEX, 1);
    expect(testnet.startsWith('cfxtest:')).toBe(true);
    expect(base32ToHex(testnet).toLowerCase()).toBe(HEX);
  });
});
