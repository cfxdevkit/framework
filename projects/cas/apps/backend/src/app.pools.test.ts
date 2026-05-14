import { WCFX_ADDRESSES } from '@cfxdevkit/protocol';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { __poolsTest } from './routes/pools.js';
import { createCasBackendApp, createCasBackendState, makeConfig } from './app.test-helpers.js';

describe('CAS backend – pools & system', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    __poolsTest.resetPoolsCache();
  });

  it('reports pools and system status surfaces', async () => {
    const config = makeConfig();
    const state = createCasBackendState(config);
    const { app } = createCasBackendApp({ config, state });

    try {
      const poolsRes = await request(app).get('/pools');
      expect(poolsRes.status).toBe(200);
      expect(
        (poolsRes.body.tokens as Array<{ address: string; symbol: string }>).map((token) => ({
          address: token.address.toLowerCase(),
          symbol: token.symbol,
        })),
      ).toEqual(
        expect.arrayContaining([
          { address: WCFX_ADDRESSES.testnet.toLowerCase(), symbol: 'WCFX' },
          { address: '0x7d682e65efc5c13bf4e394b8f376c48e6bae0355', symbol: 'USDT' },
        ]),
      );
      expect(poolsRes.body.pairs).toEqual([]);

      const systemRes = await request(app).get('/system/status');
      expect(systemRes.status).toBe(200);
      expect(systemRes.body.backend.ok).toBe(true);
      expect(systemRes.body.database.ok).toBe(true);
      expect(systemRes.body.worker.status).toBe('unknown');
    } finally {
      state.db.sqlite.close();
    }
  });

  it('loads mainnet pools from GeckoTerminal', async () => {
    const config = { ...makeConfig(), network: 'mainnet' as const };
    const state = createCasBackendState(config);
    const { app } = createCasBackendApp({ config, state });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          data: [
            {
              attributes: { address: '0x00000000000000000000000000000000000000aa' },
              relationships: {
                base_token: { data: { id: 'cfx_0x0000000000000000000000000000000000000001' } },
                quote_token: { data: { id: 'cfx_0x0000000000000000000000000000000000000002' } },
              },
            },
          ],
          included: [
            {
              type: 'token',
              attributes: {
                address: '0x0000000000000000000000000000000000000001',
                symbol: 'CFX',
                name: 'Conflux',
                decimals: 18,
                image_url: 'https://example.test/cfx.png',
              },
            },
            {
              type: 'token',
              attributes: {
                address: '0x0000000000000000000000000000000000000002',
                symbol: 'WCFX',
                name: 'Wrapped CFX',
                decimals: null,
              },
            },
          ],
        }),
      ),
    );

    try {
      const poolsRes = await request(app).get('/pools');
      expect(poolsRes.status).toBe(200);
      expect(poolsRes.body.tokens).toEqual([
        {
          address: '0x0000000000000000000000000000000000000001',
          symbol: 'CFX',
          name: 'Conflux',
          decimals: 18,
          logoURI: 'https://example.test/cfx.png',
        },
        {
          address: '0x0000000000000000000000000000000000000002',
          symbol: 'WCFX',
          name: 'Wrapped CFX',
          decimals: null,
        },
      ]);
      expect(poolsRes.body.pairs).toEqual([
        {
          address: '0x00000000000000000000000000000000000000aa',
          token0: '0x0000000000000000000000000000000000000001',
          token1: '0x0000000000000000000000000000000000000002',
        },
      ]);
    } finally {
      state.db.sqlite.close();
    }
  });
});
