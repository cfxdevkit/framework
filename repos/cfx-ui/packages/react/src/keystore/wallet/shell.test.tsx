// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KeystoreProvider } from '../context.js';
import type { KeystoreService } from '../types.js';
import { KeystoreIdentityStrip, KeystoreShell } from './shell.js';

afterEach(() => cleanup());

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeService(phase: 'blank' | 'locked' | 'unlocked' | 'active-wallet'): KeystoreService {
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
      phase,
      locked: phase === 'blank' || phase === 'locked',
      initialized: phase !== 'blank',
      walletCount: phase === 'blank' || phase === 'locked' ? 0 : wallets.length,
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

// ── KeystoreShell: distinct blank vs locked surfaces ──────────────────────────

describe('KeystoreShell', () => {
  it('renders blankSlot for blank phase', async () => {
    const service = makeService('blank');
    wrap(
      service,
      createElement(KeystoreShell, {
        blankSlot: () => createElement('div', null, 'setup-surface'),
        lockedSlot: () => createElement('div', null, 'unlock-surface'),
        activeSlot: createElement('div', null, 'active-surface'),
      }),
    );
    await waitFor(() => expect(screen.getByText('setup-surface')).toBeTruthy());
    expect(screen.queryByText('unlock-surface')).toBeNull();
    expect(screen.queryByText('active-surface')).toBeNull();
  });

  it('renders lockedSlot for locked phase (not blankSlot)', async () => {
    const service = makeService('locked');
    wrap(
      service,
      createElement(KeystoreShell, {
        blankSlot: () => createElement('div', null, 'setup-surface'),
        lockedSlot: () => createElement('div', null, 'unlock-surface'),
        activeSlot: createElement('div', null, 'active-surface'),
      }),
    );
    await waitFor(() => expect(screen.getByText('unlock-surface')).toBeTruthy());
    expect(screen.queryByText('setup-surface')).toBeNull();
    expect(screen.queryByText('active-surface')).toBeNull();
  });

  it('renders activeSlot for active-wallet phase', async () => {
    const service = makeService('active-wallet');
    wrap(
      service,
      createElement(KeystoreShell, {
        blankSlot: () => createElement('div', null, 'setup-surface'),
        lockedSlot: () => createElement('div', null, 'unlock-surface'),
        activeSlot: createElement('div', null, 'active-surface'),
      }),
    );
    await waitFor(() => expect(screen.getByText('active-surface')).toBeTruthy());
    expect(screen.queryByText('setup-surface')).toBeNull();
    expect(screen.queryByText('unlock-surface')).toBeNull();
  });

  it('blankSlot receives setup action that can be called', async () => {
    const service = makeService('blank');
    let capturedSetup: ((p: string) => Promise<void>) | null = null;
    wrap(
      service,
      createElement(KeystoreShell, {
        blankSlot: ({ setup }) => {
          capturedSetup = setup;
          return createElement('div', null, 'setup-surface');
        },
        lockedSlot: () => createElement('div', null, 'unlock-surface'),
        activeSlot: createElement('div', null, 'active-surface'),
      }),
    );
    await waitFor(() => expect(screen.getByText('setup-surface')).toBeTruthy());
    expect(capturedSetup).toBeTypeOf('function');
    if (!capturedSetup) return;
    await capturedSetup('my-passphrase');
    expect(service.setup).toHaveBeenCalledWith({ passphrase: 'my-passphrase' });
  });
});

// ── KeystoreIdentityStrip: persistent identity rendering ─────────────────────

describe('KeystoreIdentityStrip', () => {
  it('renders both eSpace and Core slots when identity is present', async () => {
    const service = makeService('active-wallet');
    wrap(
      service,
      createElement(KeystoreIdentityStrip, {
        espaceSlot: (id) => createElement('span', { 'data-testid': 'espace' }, id.espaceAddress),
        coreSlot: (id) => createElement('span', { 'data-testid': 'core' }, id.coreAddress),
        walletTriggerSlot: ({ walletName }) =>
          createElement('button', { type: 'button' }, walletName),
        accountTriggerSlot: ({ accountIndex }) =>
          createElement('button', { type: 'button' }, `acc-${accountIndex}`),
        isWalletOpen: false,
        isAccountOpen: false,
        onWalletOpen: vi.fn(),
        onWalletClose: vi.fn(),
        onAccountOpen: vi.fn(),
        onAccountClose: vi.fn(),
      }),
    );
    await waitFor(() => expect(screen.getByTestId('espace')).toBeTruthy());
    expect(screen.getByTestId('espace').textContent).toBe('0xabc');
    expect(screen.getByTestId('core').textContent).toBe('cfx:aaa');
  });

  it('returns null when no identity is present (locked phase)', async () => {
    const service = makeService('locked');
    const { container } = wrap(
      service,
      createElement(KeystoreIdentityStrip, {
        espaceSlot: (id) => createElement('span', { 'data-testid': 'espace' }, id.espaceAddress),
        coreSlot: (id) => createElement('span', { 'data-testid': 'core' }, id.coreAddress),
        walletTriggerSlot: () => createElement('button', { type: 'button' }, 'wallet'),
        accountTriggerSlot: () => createElement('button', { type: 'button' }, 'account'),
        isWalletOpen: false,
        isAccountOpen: false,
        onWalletOpen: vi.fn(),
        onWalletClose: vi.fn(),
        onAccountOpen: vi.fn(),
        onAccountClose: vi.fn(),
      }),
    );
    await waitFor(() => expect(screen.queryByTestId('espace')).toBeNull());
    expect(container.firstChild).toBeNull();
  });

  it('opens wallet switcher overlay via trigger click', async () => {
    const service = makeService('active-wallet');
    const onWalletOpen = vi.fn();
    wrap(
      service,
      createElement(KeystoreIdentityStrip, {
        espaceSlot: () => null,
        coreSlot: () => null,
        walletTriggerSlot: ({ walletName, onClick }) =>
          createElement(
            'button',
            { type: 'button', onClick, 'data-testid': 'wallet-trigger' },
            walletName,
          ),
        accountTriggerSlot: () => null,
        isWalletOpen: false,
        isAccountOpen: false,
        onWalletOpen,
        onWalletClose: vi.fn(),
        onAccountOpen: vi.fn(),
        onAccountClose: vi.fn(),
      }),
    );
    await waitFor(() => expect(screen.getByTestId('wallet-trigger')).toBeTruthy());
    fireEvent.click(screen.getByTestId('wallet-trigger'));
    expect(onWalletOpen).toHaveBeenCalled();
  });
});
