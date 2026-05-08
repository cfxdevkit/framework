import type { PriceSource } from '../conditions/price.js';

export interface SwappiQuoteReader {
  getAmountsOut(amountIn: bigint, path: readonly [string, string]): Promise<readonly bigint[]>;
}

export interface SwappiPriceSourceOptions {
  reader: SwappiQuoteReader;
  unitAmount?: bigint;
}

export class SwappiPriceSource implements PriceSource {
  readonly #reader: SwappiQuoteReader;
  readonly #unitAmount: bigint;

  constructor(options: SwappiPriceSourceOptions) {
    this.#reader = options.reader;
    this.#unitAmount = options.unitAmount ?? 10n ** 18n;
  }

  async getPrice(tokenIn: string, tokenOut: string): Promise<bigint> {
    const amounts = await this.#reader.getAmountsOut(this.#unitAmount, [tokenIn, tokenOut]);
    const amountOut = amounts.at(-1);
    if (amountOut === undefined) throw new Error('Swappi quote did not include an output amount');
    return (amountOut * 10n ** 18n) / this.#unitAmount;
  }
}
