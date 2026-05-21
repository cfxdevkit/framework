/**
 * `@cfxdevkit/cdk/address` — Conflux Core-Space base32 address codec.
 *
 * Re-exports cive's verified base32 ↔ hex helpers under framework-stable
 * names. Both spaces use the same 20-byte underlying address; the only
 * difference is the textual encoding (base32 with a network-id prefix vs.
 * hex with EIP-55 checksum).
 *
 * Conflux base32 layout: `cfx:<address>` (mainnet, networkId 1029),
 * `cfxtest:<address>` (testnet, networkId 1), `net<id>:<address>` (custom).
 */
import {
  base32AddressToHex as civeBase32ToHex,
  getAddress as civeGetAddress,
  hexAddressToBase32 as civeHexToBase32,
  isAddress as civeIsAddress,
} from 'cive/utils';
import type { Hex, Address as HexAddress } from '../types/index.js';

/**
 * Convert a 0x-hex 20-byte address to a Conflux base32 address for the given
 * networkId (1029 = mainnet, 1 = testnet).
 */
export function hexToBase32(
  hexAddress: Hex,
  networkId: number,
  opts?: { verbose?: boolean },
): string {
  return civeHexToBase32({
    hexAddress,
    networkId: networkId as never,
    ...(opts?.verbose !== undefined ? { verbose: opts.verbose as never } : {}),
  });
}

/** Convert a Conflux base32 address to a 0x-hex 20-byte address. */
export function base32ToHex(base32Address: string, opts?: { strict?: boolean }): HexAddress {
  return civeBase32ToHex({
    address: base32Address as never,
    ...(opts?.strict !== undefined ? { strict: opts.strict } : {}),
  }) as HexAddress;
}

/** `true` iff the input parses as a Conflux base32 address. */
export function isBase32Address(address: string): boolean {
  return civeIsAddress(address);
}

/**
 * Normalise a Conflux base32 address (canonicalise prefix + body casing).
 * Throws on a malformed input.
 */
export function getCoreAddress(address: string): string {
  return civeGetAddress(address as never);
}
