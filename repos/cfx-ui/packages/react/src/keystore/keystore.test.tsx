// @vitest-environment happy-dom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KeystoreProvider } from './context.js';
import type { KeystoreService } from './types.js';
import { useKeystoreAccounts } from './use-keystore-accounts.js';
import { useKeystoreIdentity } from './use-keystore-identity.js';
import { useKeystoreLifecycle } from './use-keystore-lifecycle.js';
import { useKeystoreWallets } from './use-keystore-wallets.js';

afterEach(() => cleanup());

// ── Mock service factory ───────────────────────────────────────────────────────

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
    {
      index: 1,
      espaceDerivationPath: "m/44'/60'/0'/0/1",
      espaceAddress: '0xdef',
      coreAddress: 'cfx:bbb',
      coreDerivationPath: "m/44'/503'/0'/0/1",
      active: false,
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

// ── Phase normalization ────────────────────────────────────────────────────────

describe('useKeystoreLifecycle — phase normalization', () => {
  it('reports blank phase when keystore is uninitialized', async () => {
    const service = makeService('blank');
    const { result } = renderHook(() => useKeystoreLifecycle(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.phase).toBe('blank'));
    expect(result.current.isLocked).toBe(true);
    expect(result.current.isInitialized).toBe(false);
  });

  it('reports locked phase', async () => {
    const service = makeService('locked');
    const { result } = renderHook(() => useKeystoreLifecycle(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.phase).toBe('locked'));
    expect(result.current.isLocked).toBe(true);
    expect(result.current.isInitialized).toBe(true);
  });

  it('reports unlocked phase', async () => {
    const service = makeService('unlocked');
    const { result } = renderHook(() => useKeystoreLifecycle(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.phase).toBe('unlocked'));
    expect(result.current.isLocked).toBe(false);
  });

  it('reports active-wallet phase', async () => {
    const service = makeService('active-wallet');
    const { result } = renderHook(() => useKeystoreLifecycle(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.phase).toBe('active-wallet'));
    expect(result.current.isLocked).toBe(false);
  });
});

// ── Lifecycle actions ─────────────────────────────────────────────────────────

describe('useKeystoreLifecycle — actions', () => {
  it('calls setup and refreshes state', async () => {
    const service = makeService('blank');
    // After setup, phase transitions to active-wallet
    let callCount = 0;
    (service.status as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      const phase = callCount > 1 ? 'active-wallet' : 'blank';
      return Promise.resolve({ ok: true, phase, locked: false, initialized: true, walletCount: 1 });
    });
    (service.active as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      wallet: {
        id: 'w1',
        name: 'W',
        active: true,
        accountCount: 1,
        activeAccountIndex: 0,
        accountType: 'standard',
        espaceAddress: '0xa',
        coreAddress: 'cfx:a',
        espaceDerivationPath: "m/44'/60'/0'/0/0",
        coreDerivationPath: "m/44'/503'/0'/0/0",
      },
    });
    (service.wallets.accounts as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      accounts: [
        {
          index: 0,
          espaceDerivationPath: "m/44'/60'/0'/0/0",
          espaceAddress: '0xa',
          coreAddress: 'cfx:a',
          coreDerivationPath: "m/44'/503'/0'/0/0",
          active: true,
        },
      ],
    });

    const { result } = renderHook(() => useKeystoreLifecycle(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.phase).toBe('blank'));

    await act(async () => {
      await result.current.setup('secret');
    });

    expect(service.setup).toHaveBeenCalledWith({ passphrase: 'secret' });
    await waitFor(() => expect(result.current.phase).toBe('active-wallet'));
  });

  it('stores error when action fails', async () => {
    const service = makeService('locked');
    (service.unlock as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('bad passphrase'));

    const { result } = renderHook(() => useKeystoreLifecycle(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.phase).toBe('locked'));

    await act(async () => {
      await result.current.unlock('wrong');
    });

    expect(result.current.error).toBe('bad passphrase');
  });
});

// ── Wallet list ───────────────────────────────────────────────────────────────

describe('useKeystoreWallets', () => {
  it('returns wallets in unlocked phase', async () => {
    const service = makeService('unlocked');
    const { result } = renderHook(() => useKeystoreWallets(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.wallets.length).toBe(1));
    expect(result.current.wallets[0].id).toBe('w1');
    expect(result.current.wallets[0].accountType).toBe('standard');
  });

  it('returns empty wallets in locked phase', async () => {
    const service = makeService('locked');
    const { result } = renderHook(() => useKeystoreWallets(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.wallets).toEqual([]));
  });
});

// ── Account list ──────────────────────────────────────────────────────────────

describe('useKeystoreAccounts', () => {
  it('returns accounts with dual-chain fields in active-wallet phase', async () => {
    const service = makeService('active-wallet');
    const { result } = renderHook(() => useKeystoreAccounts(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.accounts.length).toBeGreaterThan(0));
    const acc = result.current.accounts[0];
    expect(acc.espaceAddress).toBeDefined();
    expect(acc.coreAddress).toBeDefined();
    expect(acc.espaceDerivationPath).toBeDefined();
    expect(acc.coreDerivationPath).toBeDefined();
  });

  it('returns empty accounts in locked phase', async () => {
    const service = makeService('locked');
    const { result } = renderHook(() => useKeystoreAccounts(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.accounts).toEqual([]));
    expect(result.current.activeAccountIndex).toBeNull();
  });
});

// ── Dual-chain identity ────────────────────────────────────────────────────────

describe('useKeystoreIdentity', () => {
  it('returns null identity when not in active-wallet phase', async () => {
    const service = makeService('locked');
    const { result } = renderHook(() => useKeystoreIdentity(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.hasIdentity).toBe(false));
    expect(result.current.identity).toBeNull();
  });

  it('returns dual-chain identity with both addresses and paths', async () => {
    const service = makeService('active-wallet');
    const { result } = renderHook(() => useKeystoreIdentity(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.hasIdentity).toBe(true));

    const id = result.current.identity;
    if (!id) throw new Error('identity should not be null');
    expect(id.espaceAddress).toBe('0xabc');
    expect(id.coreAddress).toBe('cfx:aaa');
    expect(id.espaceDerivationPath).toBe("m/44'/60'/0'/0/0");
    expect(id.coreDerivationPath).toBe("m/44'/503'/0'/0/0");
    expect(id.accountType).toBe('standard');
    expect(id.walletId).toBe('w1');
  });

  it('never collapses to a single-address abstraction', async () => {
    const service = makeService('active-wallet');
    const { result } = renderHook(() => useKeystoreIdentity(), {
      wrapper: makeWrapper(service),
    });
    await waitFor(() => expect(result.current.hasIdentity).toBe(true));
    const id = result.current.identity;
    if (!id) throw new Error('identity should not be null');
    // Both chains must be present and non-empty
    expect(id.espaceAddress).toBeTruthy();
    expect(id.coreAddress).toBeTruthy();
  });
});
