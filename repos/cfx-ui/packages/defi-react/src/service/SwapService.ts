import {
  SWAPPI_FACTORY_ABI,
  SWAPPI_FACTORY_ADDRESS,
  SWAPPI_PAIR_ABI,
  SWAPPI_ROUTER_ABI,
  SWAPPI_ROUTER_ADDRESS,
  WCFX_ADDRESS,
} from '@cfxdevkit/abis/swappi';
import type { EspaceClient } from '@cfxdevkit/core/client';
import type { Address } from '@cfxdevkit/core/types';
import { type Abi, decodeFunctionResult, encodeFunctionData, getAddress } from 'viem';
import type { DexAdapter, Quote, SwapCalldata } from '../types.js';

/** Configuration for `SwapService`. */
export interface SwapServiceConfig {
  /** eSpace chain ID — 1030 (mainnet) or 71 (testnet). */
  chainId: number;
  /** eSpace public client from `@cfxdevkit/core`. */
  client: EspaceClient;
}

/** Pool token and reserve information for a Swappi pair. */
export interface PoolTokens {
  token0: Address;
  token1: Address;
  reserve0: bigint;
  reserve1: bigint;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const DEFAULT_SLIPPAGE_BPS = 50; // 0.5 %
const DEFAULT_DEADLINE_MS = 20 * 60 * 1000; // 20 minutes

/**
 * Swappi V2 DEX integration that implements `DexAdapter`.
 *
 * - Pure on-chain reads via the injected `EspaceClient`
 * - Single-hop and WCFX multi-hop routing
 * - `getAmountsOut` for quote calculation
 *
 * @example
 * ```ts
 * const service = new SwapService({ chainId: 71, client: espaceClient });
 * const quote = await service.getQuote({ tokenIn, tokenOut, amountIn: parseUnits('1', 18) });
 * const calldata = await service.buildCalldata(quote);
 * ```
 */
export class SwapService implements DexAdapter {
  readonly #chainId: number;
  readonly #client: EspaceClient;
  readonly #factory: Address;
  readonly #router: Address;
  readonly #wcfx: Address;

  constructor(config: SwapServiceConfig) {
    this.#chainId = config.chainId;
    this.#client = config.client;

    const cid = this.#chainId as keyof typeof SWAPPI_FACTORY_ADDRESS;
    const factoryAddr = SWAPPI_FACTORY_ADDRESS[cid];
    const routerAddr = SWAPPI_ROUTER_ADDRESS[cid as keyof typeof SWAPPI_ROUTER_ADDRESS];
    const wcfxAddr = WCFX_ADDRESS[cid as keyof typeof WCFX_ADDRESS];

    if (!factoryAddr || !routerAddr || !wcfxAddr) {
      throw new Error(`SwapService: unsupported chainId ${config.chainId}. Supported: 1030, 71.`);
    }

    // Normalize to EIP-55 checksum format so viem's encodeFunctionData accepts them.
    this.#factory = getAddress(factoryAddr);
    this.#router = getAddress(routerAddr);
    this.#wcfx = getAddress(wcfxAddr);
  }

  // ── DexAdapter ────────────────────────────────────────────────────────────

  async getQuote(params: {
    tokenIn: Address;
    tokenOut: Address;
    amountIn: bigint;
    slippageBps?: number;
    deadlineMs?: number;
  }): Promise<Quote> {
    const tokenIn = getAddress(params.tokenIn);
    const tokenOut = getAddress(params.tokenOut);
    const { amountIn } = params;
    const slippageBps = params.slippageBps ?? DEFAULT_SLIPPAGE_BPS;
    const deadlineMs = params.deadlineMs ?? Date.now() + DEFAULT_DEADLINE_MS;

    const path = await this.#buildPath(tokenIn, tokenOut);
    const amounts = await this.#getAmountsOut(amountIn, path);
    const amountOut = amounts[amounts.length - 1] ?? 0n;

    // Minimum output after slippage
    const amountOutMin = (amountOut * BigInt(10_000 - slippageBps)) / 10_000n;

    // Price impact: simplified (0 bps without reserve data)
    const priceImpactBps = 0;

    return {
      tokenIn,
      tokenOut,
      amountIn,
      amountOut,
      amountOutMin,
      priceImpactBps,
      // Store addresses in route — useful for downstream calldata building
      route: path,
      deadlineMs,
    };
  }

  async buildCalldata(quote: Quote): Promise<SwapCalldata> {
    const deadline = BigInt(Math.ceil(quote.deadlineMs / 1000));

    // Reconstruct path from route (route stores addresses or length signals hops)
    const path =
      quote.route.length >= 2 ? (quote.route as Address[]) : [quote.tokenIn, quote.tokenOut];

    // Placeholder recipient — callers must override with the actual wallet address.
    // For DexAdapter usage, the recipient is typically the connected wallet
    // address which is applied at the call-site by the `useSwap` hook.
    const to = ZERO_ADDRESS;

    const data = encodeFunctionData({
      abi: SWAPPI_ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [quote.amountIn, quote.amountOutMin, path, to, deadline],
    });

    return { to: this.#router, data };
  }

  // ── Additional pool helpers ───────────────────────────────────────────────

  /** Fetch token pair info and current reserves from a Swappi pair address. */
  async getPoolTokens(pairAddress: Address): Promise<PoolTokens> {
    const [token0, token1, reserves] = await Promise.all([
      this.#read<Address>(pairAddress, SWAPPI_PAIR_ABI, 'token0', []),
      this.#read<Address>(pairAddress, SWAPPI_PAIR_ABI, 'token1', []),
      this.#read<readonly [bigint, bigint, number]>(
        pairAddress,
        SWAPPI_PAIR_ABI,
        'getReserves',
        [],
      ),
    ]);

    return {
      token0,
      token1,
      reserve0: reserves[0],
      reserve1: reserves[1],
    };
  }

  /**
   * Get the price of `tokenAddress` denominated in `quoteToken`.
   * Returns the output amount for 1 whole token (1e18 units assumed).
   */
  async getTokenPrice(tokenAddress: Address, quoteToken: Address): Promise<bigint> {
    const amountIn = 10n ** 18n;
    const path = await this.#buildPath(tokenAddress, quoteToken);
    const amounts = await this.#getAmountsOut(amountIn, path);
    return amounts[amounts.length - 1] ?? 0n;
  }

  /** Look up the Swappi V2 pair address for two tokens. Returns zero address if pair doesn't exist. */
  async getPair(tokenA: Address, tokenB: Address): Promise<Address> {
    return this.#read<Address>(this.#factory, SWAPPI_FACTORY_ABI, 'getPair', [tokenA, tokenB]);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  async #buildPath(tokenIn: Address, tokenOut: Address): Promise<Address[]> {
    const pair = await this.getPair(tokenIn, tokenOut);
    if (pair.toLowerCase() !== ZERO_ADDRESS.toLowerCase()) {
      return [tokenIn, tokenOut];
    }
    // Multi-hop via WCFX
    return [tokenIn, this.#wcfx, tokenOut];
  }

  async #getAmountsOut(amountIn: bigint, path: Address[]): Promise<bigint[]> {
    return this.#read<bigint[]>(this.#router, SWAPPI_ROUTER_ABI, 'getAmountsOut', [amountIn, path]);
  }

  async #read<T>(
    address: Address,
    abi: readonly unknown[],
    functionName: string,
    args: readonly unknown[],
  ): Promise<T> {
    const calldata = encodeFunctionData({
      abi: abi as Abi,
      functionName,
      args: args as never[],
    });
    const result = await this.#client.request<`0x${string}`>({
      method: 'eth_call',
      params: [{ to: address, data: calldata }, 'latest'],
    });
    return decodeFunctionResult({ abi: abi as Abi, functionName, data: result }) as T;
  }
}

/**
 * Factory function — creates a `SwapService` (implements `DexAdapter`).
 *
 * @example
 * ```ts
 * const adapter = createSwapService({ chainId: 71, client: espaceClient });
 * ```
 */
export function createSwapService(config: SwapServiceConfig): SwapService {
  return new SwapService(config);
}
