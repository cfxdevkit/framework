import type { PriceSource } from '../conditions/price.js';

export interface GeckoTerminalPriceSourceOptions {
  network: string;
  baseUrl?: string;
  fetcher?: typeof fetch;
}

interface GeckoTokenResponse {
  data?: {
    attributes?: {
      price_usd?: string | number | null;
    };
  };
}

export class GeckoTerminalPriceSource implements PriceSource {
  readonly #network: string;
  readonly #baseUrl: string;
  readonly #fetcher: typeof fetch;

  constructor(options: GeckoTerminalPriceSourceOptions) {
    this.#network = options.network;
    this.#baseUrl = options.baseUrl ?? 'https://api.geckoterminal.com/api/v2';
    this.#fetcher = options.fetcher ?? fetch;
  }

  async getPrice(tokenIn: string, tokenOut: string): Promise<bigint> {
    const [tokenInUsd, tokenOutUsd] = await Promise.all([
      this.#getTokenUsd(tokenIn),
      this.#getTokenUsd(tokenOut),
    ]);
    if (tokenOutUsd === 0) throw new Error(`missing GeckoTerminal price for ${tokenOut}`);
    return decimalToScaled(tokenInUsd / tokenOutUsd);
  }

  async #getTokenUsd(token: string): Promise<number> {
    const url = `${this.#baseUrl}/networks/${this.#network}/tokens/${token}`;
    const response = await this.#fetcher(url);
    if (!response.ok) throw new Error(`GeckoTerminal request failed: ${response.status}`);
    const body = (await response.json()) as GeckoTokenResponse;
    const rawPrice = body.data?.attributes?.price_usd;
    const price = typeof rawPrice === 'number' ? rawPrice : Number.parseFloat(rawPrice ?? '');
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`missing GeckoTerminal price for ${token}`);
    }
    return price;
  }
}

export function decimalToScaled(value: number, decimals = 18): bigint {
  if (!Number.isFinite(value) || value < 0) throw new Error('price must be a non-negative number');
  return BigInt(Math.round(value * 10 ** decimals));
}
