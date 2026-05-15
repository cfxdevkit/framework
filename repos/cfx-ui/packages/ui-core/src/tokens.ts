import { useMemo } from 'react';

export const CFX_NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const WCFX_ADDRESSES = {
  mainnet: '0x14b2D3bC65e74DAE1030EAFd8ac30c533c976A9b',
  testnet: '0x2ED3dddae5B2F321AF0806181FBFA6D049Be47d8',
} as const;

export interface PairLike {
  token0: string;
  token1: string;
}

export interface SelectableTokenLike {
  address: string;
}

export interface TokenSelectionOptions {
  nativeAddress?: string;
  wrappedNativeAddress?: string;
}

export interface UseSelectableTokensOptions<TToken extends SelectableTokenLike> {
  options?: TokenSelectionOptions;
  pairs: readonly PairLike[];
  tokenInAddress: string;
  tokens: readonly TToken[];
}

export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export function wcfxAddress(network: keyof typeof WCFX_ADDRESSES = 'testnet'): string {
  return WCFX_ADDRESSES[network];
}

export function resolveTokenAddress(
  address: string,
  wrappedNativeAddress = wcfxAddress(),
  nativeAddress = CFX_NATIVE_ADDRESS,
): string {
  return normalizeAddress(address) === normalizeAddress(nativeAddress)
    ? wrappedNativeAddress
    : address;
}

export function getPairedTokens<TToken extends SelectableTokenLike>(
  pairs: readonly PairLike[],
  allTokens: readonly TToken[],
  tokenInAddress: string,
  options: TokenSelectionOptions = {},
): TToken[] {
  if (!tokenInAddress) return [...allTokens];

  const nativeAddress = options.nativeAddress ?? CFX_NATIVE_ADDRESS;
  const wrappedNativeAddress = options.wrappedNativeAddress ?? wcfxAddress();
  const incoming = normalizeAddress(tokenInAddress);
  const resolvedIncoming = normalizeAddress(
    resolveTokenAddress(tokenInAddress, wrappedNativeAddress, nativeAddress),
  );
  const wrappedNative = normalizeAddress(wrappedNativeAddress);
  const resolvedCounterparts = new Set<string>();

  for (const pair of pairs) {
    const token0 = normalizeAddress(pair.token0);
    const token1 = normalizeAddress(pair.token1);
    if (token0 === resolvedIncoming) resolvedCounterparts.add(token1);
    if (token1 === resolvedIncoming) resolvedCounterparts.add(token0);
  }

  const includeNative =
    resolvedCounterparts.has(wrappedNative) && incoming !== normalizeAddress(nativeAddress);
  resolvedCounterparts.delete(wrappedNative);
  resolvedCounterparts.delete(normalizeAddress(nativeAddress));

  const paired = allTokens.filter((token) => {
    const normalized = normalizeAddress(token.address);
    return (
      resolvedCounterparts.has(normalized) &&
      normalized !== normalizeAddress(nativeAddress) &&
      normalized !== wrappedNative
    );
  });

  if (!includeNative) return paired;

  const nativeToken = allTokens.find(
    (token) => normalizeAddress(token.address) === normalizeAddress(nativeAddress),
  );

  return nativeToken ? [nativeToken, ...paired] : paired;
}

export function useSelectableTokens<TToken extends SelectableTokenLike>(
  options: UseSelectableTokensOptions<TToken>,
): TToken[] {
  return useMemo(
    () => getPairedTokens(options.pairs, options.tokens, options.tokenInAddress, options.options),
    [options.options, options.pairs, options.tokenInAddress, options.tokens],
  );
}
