import { recoverMessageAddress } from 'viem';
import { getAddress, isAddress } from 'viem/utils';
import { parseSiweMessage } from './parse.js';
import type { VerifySiweMessageInput, VerifySiweMessageResult } from './types.js';

export async function verifySiweMessage(
  input: VerifySiweMessageInput,
): Promise<VerifySiweMessageResult> {
  try {
    const parsed = parseSiweMessage(input.message);
    if (!isAddress(parsed.address)) return { ok: false, error: 'SIWE address is invalid' };
    const recovered = await recoverMessageAddress({
      message: input.message,
      signature: input.signature,
    });
    if (getAddress(recovered) !== getAddress(parsed.address)) {
      return { ok: false, error: 'SIWE signature does not match message address' };
    }
    const expectedAddress = input.expectedAddress;
    if (expectedAddress && getAddress(expectedAddress) !== getAddress(parsed.address)) {
      return { ok: false, error: 'SIWE address does not match expected address' };
    }
    if (input.expectedDomain && parsed.domain !== input.expectedDomain) {
      return { ok: false, error: 'SIWE domain does not match expected domain' };
    }
    if (input.expectedNonce && parsed.nonce !== input.expectedNonce) {
      return { ok: false, error: 'SIWE nonce does not match expected nonce' };
    }
    if (input.expectedChainId && parsed.chainId !== input.expectedChainId) {
      return { ok: false, error: 'SIWE chain id does not match expected chain id' };
    }
    const now = input.now ?? new Date();
    if (parsed.expirationTime && new Date(parsed.expirationTime) <= now) {
      return { ok: false, error: 'SIWE message has expired' };
    }
    if (parsed.notBefore && new Date(parsed.notBefore) > now) {
      return { ok: false, error: 'SIWE message is not valid yet' };
    }
    return { ok: true, address: parsed.address, message: parsed };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : String(cause) };
  }
}
