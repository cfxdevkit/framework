// @vitest-environment happy-dom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KeystoreProvider } from './context.js';
import type { KeystoreService } from './types.js';
import { useKeystoreWallets } from './use-keystore-wallets.js';

afterEach(() => cleanup());

function makeService(phase: 'blank' | 'locked' | 'unlocked' | 'active-wallet'): KeystoreService {
  const wallets = [
    {
      id: 'w1',
      name: 'Wallet One',
      active: true,
      accountCount: 2,
      activeAccountIndex: 0,
      accountType: 'standard' as const,
      firstEspaceAddress: '0xabc',
    },
  ];

  const activeWallet = {
    ...wallets[0],
    espaceAddress: '0xabc',
    coreAddress: 'cfx:aaa',
    espaceDerivationPath: "m/44'/60'/0'/0/0",
    coreDerivationPath: "m/44'/503'/0'/0/0",
  };

  const accounts = [
    {
      index: 0,
      espaceDerivationPath: "m/44'/60'/0'/0/0",
      espaceAddress: '0xabc',
      coreAddress: 'cfx:aaa',
      coreDerivationPath: "m/44'/503'/0'/0/0",
      active: true,
    },
  ];

  return {
    status: vi.fn().mockResolvedValue({
      ok: true,
      phase,
      locked: phase === 'blank' || phase === 'locked',
      initialized: phase !== 'blank',
      walletCount: phase === 'blank' || phase === 'locked' ? 0 : 1,
    }),
    setup: vi.fn().mockResolvedValue({ ok: true }),
    unlock: vi.fn().mockResolvedValue({ ok: true }),
    lock: vi.fn().mockResolvedValue({ ok: true }),
    active: vi.fn().mockResolvedValue({ ok: true, wallet: activeWallet }),
    wallets: {
      list: vi.fn().mockResolvedValue({ ok: true, wallets }),
      add: vi.fn().mockResolvedValue({ ok: true }),
      activate: vi.fn().mockResolvedValue({ ok: true }),
      delete: vi.fn().mockResolvedValue({ ok: true }),
      rename: vi.fn().mockResolvedValue({ ok: true }),
      accounts: vi.fn().mockResolvedValue({ ok: true, accounts }),
      activateAccount: vi.fn().mockResolvedValue({ ok: true }),
    },
  };
}

function makeWrapper(service: KeystoreService) {
  return ({ children }: { children: ReactNode }) =>
    createElement(KeystoreProvider, { keystore: service, pollIntervalMs: 0 }, children);
}

// ── Mutation refresh ──────────────────────────────────────────────────────────

describe('wallet mutation refresh', () => {
  it('refreshes wallet list after addWallet', async () => {
    const service = makeService('unlocked');
    let listed = false;
    (service.wallets.list as ReturnType<typeof vi.fn>).mockImplementation(() => {
      const count = listed ? 2 : 1;
      listed = true;
      return Promise.resolve({
        ok: true,
        wallets: Array.from({ length: count }, (_, i) => ({
          id: `w${i + 1}`,
          name: `W${i + 1}`,
          active: i === 0,
          accountCount: 1,
          activeAccountIndex: 0,
          accountType: 'standard' as const,
        })),
      });
    });

    const { result } = renderHook(() => useKeystoreWallets(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.wallets.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.addWallet({ mnemonic: 'test mnemonic phrase', name: 'New Wallet' });
    });

    expect(service.wallets.add).toHaveBeenCalledWith({
      mnemonic: 'test mnemonic phrase',
      name: 'New Wallet',
    });
    await waitFor(() => expect(result.current.wallets.length).toBe(2));
  });
});
