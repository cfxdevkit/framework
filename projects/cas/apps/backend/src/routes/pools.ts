import type { CasPairInfo, CasPoolsResponse, CasTokenInfo } from '@cfxdevkit/cas-shared';
import type { Router } from 'express';
import express from 'express';
import type { CasBackendState } from '../types.js';
import { readFallbackPools } from './pool-fallback.js';

const GECKO_BASE_URL = 'https://api.geckoterminal.com/api/v2';
const GECKO_HEADERS = {
  accept: 'application/json;version=20230302',
  'user-agent': 'conflux-cas-backend/0.1',
};
const MAX_GECKO_PAGES = 10;
const GECKO_PAGE_DELAY_MS = 1_200;

let poolsCache: { data: CasPoolsResponse; fetchedAt: number } | null = null;
let poolsInflight: Promise<CasPoolsResponse> | null = null;

const permanentTokens = new Map<string, CasTokenInfo>();
const permanentPairs = new Map<string, CasPairInfo>();

export function createPoolsRouter(state: CasBackendState): Router {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    try {
      res.json(await readPools(state));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (permanentTokens.size > 0) {
        res.json(buildPermanentPoolsResponse());
        return;
      }
      res.status(502).json({ error: `Failed to fetch pools: ${message}` });
    }
  });

  router.post('/refresh', async (_req, res) => {
    resetPoolsCache();
    try {
      res.json(await readPools(state));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `Failed to fetch pools: ${message}` });
    }
  });

  return router;
}

async function readPools(state: CasBackendState): Promise<CasPoolsResponse> {
  const now = Date.now();
  if (poolsCache && now - poolsCache.fetchedAt < state.config.poolsCacheTtlMs) {
    return poolsCache.data;
  }

  if (!poolsInflight) {
    poolsInflight = fetchPools(state).finally(() => {
      poolsInflight = null;
    });
  }

  const fresh = await poolsInflight;
  mergePools(fresh);
  const merged = buildPermanentPoolsResponse();
  poolsCache = { data: merged, fetchedAt: Date.now() };
  return merged;
}

async function fetchPools(state: CasBackendState): Promise<CasPoolsResponse> {
  if (state.config.network === 'mainnet') return fetchPoolsFromGecko();
  return readFallbackPools({ network: state.config.network, rpcUrl: state.config.rpcUrl });
}

interface GeckoTokenResource {
  type: string;
  attributes?: {
    address?: string;
    symbol?: string;
    name?: string;
    decimals?: number | null;
    image_url?: string | null;
  };
}

interface GeckoPoolResource {
  attributes?: {
    address?: string;
  };
  relationships?: {
    base_token?: { data?: { id?: string } };
    quote_token?: { data?: { id?: string } };
  };
}

interface GeckoPoolsPage {
  data?: GeckoPoolResource[];
  included?: GeckoTokenResource[];
}

async function fetchPoolsFromGecko(
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<CasPoolsResponse> {
  const tokenMap = new Map<string, CasTokenInfo>();
  const rawPairs: Array<{ address: string; token0: string; token1: string }> = [];

  for (let page = 1; page <= MAX_GECKO_PAGES; page++) {
    const body = await fetchGeckoPage(fetchFn, page);
    if (!body) break;

    const pools = body.data ?? [];
    if (pools.length === 0) break;

    for (const resource of body.included ?? []) {
      const token = readGeckoToken(resource);
      if (token) tokenMap.set(token.address.toLowerCase(), token);
    }

    for (const pool of pools) {
      const pair = readGeckoPair(pool);
      if (pair) rawPairs.push(pair);
    }

    if (pools.length < 20) break;
    if (page < MAX_GECKO_PAGES) await sleep(GECKO_PAGE_DELAY_MS);
  }

  const pairs = rawPairs.filter(
    (pair) => tokenMap.has(pair.token0) && tokenMap.has(pair.token1),
  ) as CasPairInfo[];
  const tokens = Array.from(tokenMap.values()).sort((left, right) =>
    left.symbol.localeCompare(right.symbol),
  );

  return { tokens, pairs, cachedAt: Date.now() };
}

async function fetchGeckoPage(
  fetchFn: typeof fetch,
  page: number,
  maxRetries = 4,
): Promise<GeckoPoolsPage | null> {
  const url = `${GECKO_BASE_URL}/networks/cfx/dexes/swappi/pools?page=${page}&include=base_token%2Cquote_token`;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetchFn(url, {
      headers: GECKO_HEADERS,
      signal: AbortSignal.timeout(20_000),
    });
    if (response.ok) return (await response.json()) as GeckoPoolsPage;
    if (response.status !== 429) return null;

    const retryAfterSeconds = Number(response.headers.get('retry-after') ?? 0);
    const waitMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1_000 : 2_500 * attempt;
    await sleep(waitMs);
  }
  return null;
}

function readGeckoToken(resource: GeckoTokenResource): CasTokenInfo | null {
  if (resource.type !== 'token') return null;
  const attributes = resource.attributes;
  const address = attributes?.address?.toLowerCase();
  const symbol = attributes?.symbol?.trim();
  const name = attributes?.name?.trim();
  if (!address?.startsWith('0x') || !symbol || !name) return null;
  if (symbol.startsWith('[') || symbol.endsWith(']')) return null;
  const decimals = attributes?.decimals ?? null;
  const logoURI = attributes?.image_url ?? undefined;
  return {
    address: address as CasTokenInfo['address'],
    symbol,
    name,
    decimals,
    ...(logoURI ? { logoURI } : {}),
  };
}

function readGeckoPair(pool: GeckoPoolResource) {
  const address = pool.attributes?.address?.toLowerCase();
  const token0 = normalizeGeckoTokenId(pool.relationships?.base_token?.data?.id);
  const token1 = normalizeGeckoTokenId(pool.relationships?.quote_token?.data?.id);
  if (!address?.startsWith('0x') || !token0 || !token1) return null;
  return {
    address: address as CasPairInfo['address'],
    token0,
    token1,
  };
}

function normalizeGeckoTokenId(value: string | undefined): CasTokenInfo['address'] | null {
  const address = value?.replace(/^cfx_/, '').toLowerCase();
  return address?.startsWith('0x') ? (address as CasTokenInfo['address']) : null;
}

function mergePools(response: CasPoolsResponse): void {
  for (const token of response.tokens) {
    permanentTokens.set(token.address.toLowerCase(), {
      ...token,
      address: token.address.toLowerCase() as CasTokenInfo['address'],
    });
  }
  for (const pair of response.pairs) {
    const token0 = pair.token0.toLowerCase() as CasPairInfo['token0'];
    const token1 = pair.token1.toLowerCase() as CasPairInfo['token1'];
    permanentPairs.set([token0, token1].sort().join('|'), {
      address: pair.address.toLowerCase() as CasPairInfo['address'],
      token0,
      token1,
    });
  }
}

function buildPermanentPoolsResponse(): CasPoolsResponse {
  const tokens = Array.from(permanentTokens.values()).sort((left, right) =>
    left.symbol.localeCompare(right.symbol),
  );
  const validTokens = new Set(tokens.map((token) => token.address));
  const pairs = Array.from(permanentPairs.values()).filter(
    (pair) => validTokens.has(pair.token0) && validTokens.has(pair.token1),
  );
  return { tokens, pairs, cachedAt: Date.now() };
}

function resetPoolsCache(): void {
  poolsCache = null;
  poolsInflight = null;
  permanentTokens.clear();
  permanentPairs.clear();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const __poolsTest = {
  fetchPoolsFromGecko,
  resetPoolsCache,
};
