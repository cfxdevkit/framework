import { describe, expect, it, vi } from 'vitest';
import { signerFromSatochip } from './index.js';

const ADDR = '0x1111111111111111111111111111111111111111';
const R = `0x${'01'.repeat(32)}`;
const S = `0x${'02'.repeat(32)}`;
const SIG_RSV = `${R}${S.slice(2)}1b`;

interface BridgeState {
  health?: { status: string; card_connected: boolean };
  address?: string;
  signature?: string;
  pinAccepts?: string;
}

function mockFetch(state: BridgeState) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const u = new URL(url);
    if (u.pathname === '/health') {
      return jsonResponse(state.health ?? { status: 'ok', card_connected: true }, 200);
    }
    if (u.pathname === '/init') {
      const body = JSON.parse(init?.body as string) as { pin: string };
      if (state.pinAccepts && body.pin !== state.pinAccepts) {
        return jsonResponse({ detail: 'wrong PIN' }, 400);
      }
      return jsonResponse({ success: true }, 200);
    }
    if (u.pathname === '/address') {
      return jsonResponse(
        { address: state.address ?? ADDR, keypath: u.searchParams.get('keypath') },
        200,
      );
    }
    if (u.pathname === '/sign-message' || u.pathname === '/sign-transaction') {
      return jsonResponse({ signature: state.signature ?? SIG_RSV, txHash: '0x00' }, 200);
    }
    return jsonResponse({ detail: 'not found' }, 404);
  }) as unknown as typeof fetch;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('signerFromSatochip', () => {
  it('builds a signer using the bridge address endpoint', async () => {
    const fetch = mockFetch({});
    const signer = await signerFromSatochip({ fetch });
    expect(signer.account.address).toBe(ADDR);
  });

  it('throws bridge-unreachable when /health fails', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError('connect ECONNREFUSED');
    }) as unknown as typeof fetch;
    await expect(signerFromSatochip({ fetch })).rejects.toMatchObject({
      code: 'wallet/hardware/satochip/bridge-unreachable',
    });
  });

  it('throws no-card when bridge reports disconnected', async () => {
    const fetch = mockFetch({ health: { status: 'ok', card_connected: false } });
    await expect(signerFromSatochip({ fetch })).rejects.toMatchObject({
      code: 'wallet/hardware/satochip/no-card',
    });
  });

  it('throws bad-pin on failed /init', async () => {
    const fetch = mockFetch({ pinAccepts: '1234' });
    await expect(signerFromSatochip({ fetch, pin: '0000' })).rejects.toMatchObject({
      code: 'wallet/hardware/satochip/bad-pin',
    });
  });

  it('signMessage returns a 65-byte hex signature', async () => {
    const fetch = mockFetch({});
    const signer = await signerFromSatochip({ fetch });
    const sig = await signer.signMessage('hello');
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('signTransaction produces an EIP-1559 raw tx', async () => {
    const fetch = mockFetch({});
    const signer = await signerFromSatochip({ fetch });
    const raw = await signer.signTransaction({
      chainId: 1030,
      to: '0x3333333333333333333333333333333333333333',
      value: 1n,
      nonce: 0,
      gas: 21_000n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
    });
    expect(raw).toMatch(/^0x02[0-9a-f]+$/);
  });

  it('expectedAddress mismatch rejects', async () => {
    const fetch = mockFetch({});
    await expect(
      signerFromSatochip({
        fetch,
        expectedAddress: '0x2222222222222222222222222222222222222222',
      }),
    ).rejects.toMatchObject({ code: 'wallet/hardware/address-mismatch' });
  });
});
