import type { CasHexAddress } from './jobs.js';

export interface CasTokenInfo {
  address: CasHexAddress;
  symbol: string;
  name: string;
  decimals: number | null;
  logoURI?: string;
}

export interface CasPairInfo {
  address: CasHexAddress;
  token0: CasHexAddress;
  token1: CasHexAddress;
}

export interface CasPoolsResponse {
  tokens: CasTokenInfo[];
  pairs: CasPairInfo[];
  cachedAt: number;
}
