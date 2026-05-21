import type { EspaceClient } from '@cfxdevkit/cdk/client';
import { createSwapService, type SwapServiceConfig } from '../service/index.js';
import type { DexAdapter } from '../types.js';

/**
 * Creates a `DexAdapter` backed by the Swappi V2 protocol on Conflux eSpace.
 *
 * This is the entry point for integrating Swappi into `useSwap`.
 *
 * @example
 * ```tsx
 * const adapter = createSwappiAdapter({ chainId: 71, client: espaceClient });
 * const { quote, swapAsync } = useSwap({ adapter, tokenIn, tokenOut, amountIn });
 * ```
 */
export function createSwappiAdapter(config: { chainId: number; client: EspaceClient }): DexAdapter {
  return createSwapService(config as SwapServiceConfig);
}
