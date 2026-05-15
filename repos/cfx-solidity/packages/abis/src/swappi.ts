/**
 * Swappi V2 ABIs and deployed addresses for Conflux eSpace.
 *
 * Swappi V2 is a Uniswap V2 fork — ABIs follow the canonical
 * IUniswapV2Factory / IUniswapV2Router02 / IUniswapV2Pair interfaces.
 *
 * @see https://docs.swappi.io/developers/deployed-contracts
 *
 * Addresses are provided as-is — verify against official Swappi docs before
 * using in production.
 *
 * Chain IDs:
 *   1030 — Conflux eSpace mainnet
 *     71 — Conflux eSpace testnet
 */

export { SWAPPI_FACTORY_ABI } from './swappi-factory.js';
export { SWAPPI_PAIR_ABI } from './swappi-pair.js';
export { SWAPPI_ROUTER_ABI } from './swappi-router.js';

/** Swappi V2 Factory deployed addresses keyed by eSpace chain ID. */
export const SWAPPI_FACTORY_ADDRESS = {
  1030: '0xe2a6f7c0ce4d5d300f97aa7e125455f5cd3342f5' as const,
  71: '0xf22a40f0d158e0e78A58fc4dFEC24f94EA87F879' as const,
} as const;

/** Swappi V2 Router02 deployed addresses keyed by eSpace chain ID. */
export const SWAPPI_ROUTER_ADDRESS = {
  1030: '0xE37B52296b0bAA91412cD0Cd97975B0805037B84' as const,
  71: '0x873789AaF553Fd0B4252d0D2B72C6331c7aDB0C3' as const,
} as const;

/** Wrapped CFX (WCFX) deployed addresses keyed by eSpace chain ID. */
export const WCFX_ADDRESS = {
  1030: '0x14b2D3bC65e74DAE1030EAFd8ac30c533c976A9B' as const,
  71: '0x2Ed3dddae5B2F321AF0806181FBFA6D049Be47d8' as const,
} as const;
