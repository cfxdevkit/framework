// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KeystoreProvider } from './context.js';
import type { KeystoreService } from './types.js';
import { KeystoreAccountSwitcher, KeystoreWalletSwitcher } from './wallet-shell.js';

afterEach(() => cleanup());

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeService(): KeystoreService {
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
  const wallets = [
    {
      id: 'w1',
      name: 'Alpha',
      active: true,
      accountCount: 2,
      activeAccountIndex: 0,
      accountType: 'standard' as const,
    },
    {
      id: 'w2',
      name: 'Beta',
      active: false,
      accountCount: 1,
      activeAccountIndex: 0,
      accountType: 'standard' as const,
    },
  ];
  return {
    status: vi.fn().mockResolvedValue({
      ok: true,
      phase: 'active-wallet',
      locked: false,
      initialized: true,
      walletCount: wallets.length,
    }),
    setup: vi.fn().mockResolvedValue({ ok: true }),
    unlock: vi.fn().mockResolvedValue({ ok: true }),
    lock: vi.fn().mockResolvedValue({ ok: true }),
    active: vi.fn().mockResolvedValue({
      ok: true,
      wallet: {
        ...wallets[0],
        espaceAddress: '0xabc',
        coreAddress: 'cfx:aaa',
        espaceDerivationPath: "m/44'/60'/0'/0/0",
        coreDerivationPath: "m/44'/503'/0'/0/0",
      },
    }),
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

function wrap(service: KeystoreService, children: ReactNode) {
  return render(
    createElement(KeystoreProvider, { keystore: service, pollIntervalMs: 0 }, children),
  );
}

// ── KeystoreWalletSwitcher ────────────────────────────────────────────────────

describe('KeystoreWalletSwitcher', () => {
  it('renders one row per wallet and marks active one', async () => {
    const service = makeService();
    wrap(
      service,
      createElement(KeystoreWalletSwitcher, {
        onClose: vi.fn(),
        walletRowSlot: ({ wallet, isActive }) =>
          createElement(
            'div',
            { key: wallet.id, 'data-testid': `row-${wallet.id}`, 'data-active': String(isActive) },
            wallet.name,
          ),
      }),
    );
    await waitFor(() => expect(screen.getByTestId('row-w1')).toBeTruthy());
    expect(screen.getByTestId('row-w1').getAttribute('data-active')).toBe('true');
    expect(screen.getByTestId('row-w2').getAttribute('data-active')).toBe('false');
  });

  it('calls activateWallet and onClose when a row activates', async () => {
    const service = makeService();
    const onClose = vi.fn();
    wrap(
      service,
      createElement(KeystoreWalletSwitcher, {
        onClose,
        walletRowSlot: ({ wallet, onActivate }) =>
          createElement(
            'button',
            {
              type: 'button',
              key: wallet.id,
              'data-testid': `activate-${wallet.id}`,
              onClick: onActivate,
            },
            wallet.name,
          ),
      }),
    );
    await waitFor(() => expect(screen.getByTestId('activate-w2')).toBeTruthy());
    fireEvent.click(screen.getByTestId('activate-w2'));
    await waitFor(() => expect(service.wallets.activate).toHaveBeenCalledWith('w2'));
    expect(onClose).toHaveBeenCalled();
  });
});

// ── KeystoreAccountSwitcher ───────────────────────────────────────────────────

describe('KeystoreAccountSwitcher', () => {
  it('renders one row per account with both eSpace and Core data', async () => {
    const service = makeService();
    wrap(
      service,
      createElement(KeystoreAccountSwitcher, {
        onClose: vi.fn(),
        accountRowSlot: ({ account, isActive }) =>
          createElement(
            'div',
            {
              key: account.index,
              'data-testid': `acc-${account.index}`,
              'data-active': String(isActive),
            },
            `${account.espaceAddress}|${account.coreAddress}`,
          ),
      }),
    );
    await waitFor(() => expect(screen.getByTestId('acc-0')).toBeTruthy());
    // Both addresses must be present in each row
    expect(screen.getByTestId('acc-0').textContent).toBe('0xabc|cfx:aaa');
    expect(screen.getByTestId('acc-1').textContent).toBe('0xdef|cfx:bbb');
    expect(screen.getByTestId('acc-0').getAttribute('data-active')).toBe('true');
    expect(screen.getByTestId('acc-1').getAttribute('data-active')).toBe('false');
  });
});
