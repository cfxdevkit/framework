/**
 * Shared types for `@cfxdevkit/defi-react`.
 * DexAdapter and TokenInfo are interfaces consumers implement / provide.
 */
import type { Address, Hash, Wei } from '@cfxdevkit/cdk/types';

// ── Token ──────────────────────────────────────────────────────────────────

export type ChainId = number;

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  chainId: ChainId;
  /** Optional IPFS/HTTPS logo URI. */
  logoURI?: string;
}

// ── DEX Adapter (interface implemented by consumers / protocol packages) ──

export interface Quote {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: Wei;
  /** Expected output before slippage. */
  amountOut: Wei;
  /** Minimum output after slippage tolerance (already applied). */
  amountOutMin: Wei;
  /** Price impact in basis points. */
  priceImpactBps: number;
  /** Execution hop path as token addresses, e.g. `[WCFX, USDT]`. */
  route: string[];
  /** Expiry as unix ms. */
  deadlineMs: number;
}

export interface SwapCalldata {
  /** Contract to call (e.g. the router). */
  to: Address;
  /** ABI-encoded call. */
  data: `0x${string}`;
  /** Native value to attach (for CFX → token swaps). */
  value?: Wei;
}

export interface BuildSwapCalldataOptions {
  /** Wallet receiving the swap output. */
  recipient?: Address;
}

export class DexError extends Error {
  readonly code: string;
  constructor(message: string, code = 'DEX_ERROR') {
    super(message);
    this.name = 'DexError';
    this.code = code;
  }
}

/**
 * Interface consumers implement to provide a DEX integration to `useSwap`.
 * Framework ships no concrete adapters — adapters live in domain packages
 * (e.g. `@cfxdevkit/automation`).
 */
export interface DexAdapter {
  /**
   * Fetch a swap quote. Throws `DexError` if no route is found.
   */
  getQuote(params: {
    tokenIn: Address;
    tokenOut: Address;
    amountIn: Wei;
    /** Default 50 bps (0.5%). */
    slippageBps?: number;
    deadlineMs?: number;
  }): Promise<Quote>;

  /**
   * Encode the swap transaction. Returns the calldata ready to be submitted.
   * Does NOT submit — `useSwap` handles submission via `useSendTransaction`.
   */
  buildCalldata(quote: Quote, options?: BuildSwapCalldataOptions): Promise<SwapCalldata>;

  /**
   * ERC-20 spender that must be approved before token-in swaps.
   * Native CFX swaps do not require approvals.
   */
  getSpenderAddress?(): Address;
}

// ── Token registry ────────────────────────────────────────────────────────

export interface TokenRegistry {
  /** Returns tokens matching `query` (by symbol or name, case-insensitive). */
  search(query: string, chainId?: ChainId): TokenInfo[];
  /** Returns all tokens, optionally filtered by chainId. */
  list(chainId?: ChainId): TokenInfo[];
  /** Returns the token with the given address, or `undefined`. */
  getByAddress(address: Address, chainId?: ChainId): TokenInfo | undefined;
}

/**
 * Creates a searchable, filterable token registry from a static list.
 */
export function createTokenRegistry(tokens: readonly TokenInfo[]): TokenRegistry {
  return {
    search(query, chainId) {
      const q = query.trim().toLowerCase();
      return tokens.filter(
        (t) =>
          (!chainId || t.chainId === chainId) &&
          (t.symbol.toLowerCase().includes(q) ||
            t.name.toLowerCase().includes(q) ||
            t.address.toLowerCase() === q),
      );
    },
    list(chainId) {
      return chainId ? tokens.filter((t) => t.chainId === chainId) : [...tokens];
    },
    getByAddress(address, chainId) {
      const addr = address.toLowerCase();
      return tokens.find(
        (t) => t.address.toLowerCase() === addr && (!chainId || t.chainId === chainId),
      );
    },
  };
}

// ── Portfolio ─────────────────────────────────────────────────────────────

export interface PortfolioRow {
  token: TokenInfo;
  balance: Wei;
  /** Human-readable with decimals applied, e.g. "1.234". */
  formatted: string;
}

// ── Tx status ─────────────────────────────────────────────────────────────

export type TxStatus = 'pending' | 'success' | 'failed';

export interface TrackedTx {
  hash: Hash;
  status: TxStatus;
  label?: string;
  submittedAt: number;
}
