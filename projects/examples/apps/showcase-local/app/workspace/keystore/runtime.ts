'use client';

import { StatusBadge } from '@cfxdevkit/example-showcase-ui';
import {
  useKeystoreAccounts,
  useKeystoreIdentity,
  useKeystoreLifecycle,
  useKeystoreWallets,
} from '@cfxdevkit/react/keystore';
import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import type {
  DevnodeAccountSummary,
  DevnodeProfileStateResponse,
  DevnodeStatusResponse,
} from '../../../lib/devnode-types';
import { fetchDevnodeProfiles, fetchDevnodeStatus } from '../../devnode/devnode-client';
import { fetchDevnodeAccounts } from '../../keystore/client';
import type { NetworkId, SpaceId } from '../shared';
import { faucetFor, faucetLinksFor, syncWalletDrafts } from '../shared';

type WorkspaceLog = (message: string, level?: 'error') => void;

export function useShowcaseWorkspaceKeystoreRuntime({
  log,
  network,
  space,
}: {
  log: WorkspaceLog;
  network: NetworkId;
  space: SpaceId;
}) {
  // ── Keystore state — delegated to reusable hooks (state lives in KeystoreProvider) ──
  const keystoreLifecycle = useKeystoreLifecycle();
  const keystoreWallets = useKeystoreWallets();
  const keystoreAccounts = useKeystoreAccounts();
  const { identity } = useKeystoreIdentity();

  // ── Devnode state ─────────────────────────────────────────────────────────
  const [devnode, setDevnode] = useState<DevnodeStatusResponse | null>(null);
  const [devnodeBusy, setDevnodeBusy] = useState<
    'refresh' | 'start' | 'restart' | 'stop' | 'wipe' | 'mine' | null
  >(null);
  const [devnodeError, setDevnodeError] = useState<string | null>(null);
  const [devnodeAccounts, setDevnodeAccounts] = useState<DevnodeAccountSummary[]>([]);
  const [faucet, setFaucet] = useState<DevnodeAccountSummary | null>(null);
  const [faucetBusy, setFaucetBusy] = useState(false);
  const [faucetError, setFaucetError] = useState<string | null>(null);

  // ── Node profile state ────────────────────────────────────────────────────
  const [nodeProfileState, setNodeProfileState] = useState<DevnodeProfileStateResponse | null>(
    null,
  );
  const [nodeProfileBusy, setNodeProfileBusy] = useState<'select' | null>(null);
  const [nodeProfileActionId, setNodeProfileActionId] = useState<string | null>(null);
  const [nodeProfileError, setNodeProfileError] = useState<string | null>(null);

  // ── Wallet name drafts (local form state, not keystore state) ─────────────
  const [walletNameDrafts, setWalletNameDrafts] = useState<Record<string, string>>({});

  // ── Devnode refresh ───────────────────────────────────────────────────────
  const refreshDevnode = useCallback(
    async (options?: { logMessage?: string; silent?: boolean }) => {
      if (!options?.silent) setDevnodeBusy('refresh');
      try {
        const next = await fetchDevnodeStatus();
        setDevnode(next);
        setDevnodeError(next.error ?? null);
        if (options?.logMessage) log(options.logMessage);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setDevnodeError(message);
        log(message, 'error');
      } finally {
        if (!options?.silent) setDevnodeBusy(null);
      }
    },
    [log],
  );

  const refreshDevnodeAccounts = useCallback(async () => {
    try {
      const next = await fetchDevnodeAccounts();
      setDevnodeAccounts(next?.accounts ?? []);
      setFaucet(next?.faucet ?? null);
    } catch {
      // silently ignore — devnode may not be running
    }
  }, []);

  const refreshProfiles = useCallback(async () => {
    try {
      const nextProfiles = await fetchDevnodeProfiles();
      setNodeProfileState(nextProfiles);
      setNodeProfileError(
        nextProfiles.ok ? null : (nextProfiles.error ?? 'Unable to load node profiles.'),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setNodeProfileError(message);
    }
  }, []);

  /**
   * Refreshes keystore state (via provider), devnode accounts, and profiles.
   * Called by devnode actions that may affect the accessible accounts list.
   *
   * Pass `keystoreOnly: true` to skip devnode/profile refreshes when only
   * keystore state has changed (e.g., wallet-only mutations).
   */
  const refreshKeystore = useCallback(
    async (options?: { logMessage?: string; silent?: boolean; keystoreOnly?: boolean }) => {
      if (options?.keystoreOnly) {
        await keystoreLifecycle.refresh();
      } else {
        await Promise.all([
          keystoreLifecycle.refresh(),
          refreshDevnodeAccounts(),
          refreshProfiles(),
        ]);
      }
      if (options?.logMessage) log(options.logMessage);
    },
    [keystoreLifecycle, refreshDevnodeAccounts, refreshProfiles, log],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    void refreshDevnode();
    void refreshDevnodeAccounts();
    void refreshProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync wallet name drafts when wallets change
  useEffect(() => {
    setWalletNameDrafts((current) => syncWalletDrafts(current, keystoreWallets.wallets));
  }, [keystoreWallets.wallets]);

  // ── Computed badges ───────────────────────────────────────────────────────
  const devnodeBadge = useMemo(() => {
    if (devnodeError || devnode?.status === 'error')
      return createElement(StatusBadge, { label: 'error', status: 'error' });
    if (devnode?.running) return createElement(StatusBadge, { label: 'running', status: 'ok' });
    if (devnodeBusy === 'refresh')
      return createElement(StatusBadge, { label: 'loading', status: 'pending' });
    return createElement(StatusBadge, { label: 'stopped', status: 'info' });
  }, [devnode, devnodeBusy, devnodeError]);

  const keystoreBadge = useMemo(() => {
    if (keystoreLifecycle.error)
      return createElement(StatusBadge, { label: 'error', status: 'error' });
    if (!keystoreLifecycle.isInitialized)
      return createElement(StatusBadge, { label: 'loading', status: 'pending' });
    if (keystoreLifecycle.phase === 'blank')
      return createElement(StatusBadge, { label: 'setup required', status: 'info' });
    if (keystoreLifecycle.phase === 'locked')
      return createElement(StatusBadge, { label: 'locked', status: 'pending' });
    if (keystoreLifecycle.phase === 'active-wallet' && keystoreAccounts.activeWallet)
      return createElement(StatusBadge, { label: 'signer ready', status: 'ok' });
    return createElement(StatusBadge, { label: 'unlocked', status: 'info' });
  }, [
    keystoreLifecycle.error,
    keystoreLifecycle.isInitialized,
    keystoreLifecycle.phase,
    keystoreAccounts.activeWallet,
  ]);

  // Reconstruct keystoreStatus for panels that still read from props
  const keystoreStatus = useMemo(
    () => ({
      ok: true,
      phase: keystoreLifecycle.phase,
      locked: keystoreLifecycle.isLocked,
      initialized: keystoreLifecycle.isInitialized,
      walletCount: keystoreWallets.walletCount,
      ...(keystoreLifecycle.resetGuidance
        ? {
            reset: {
              destructive: true as const,
              mode: 'cli' as const,
              ...keystoreLifecycle.resetGuidance,
            },
          }
        : {}),
    }),
    [keystoreLifecycle, keystoreWallets.walletCount],
  );

  return {
    // ── Keystore lifecycle (from reusable hooks) ──
    keystorePhase: keystoreLifecycle.phase,
    keystoreReady: keystoreLifecycle.isInitialized && !keystoreLifecycle.isLocked,
    keystoreBusy: keystoreLifecycle.isBusy
      ? ('refresh' as const)
      : (null as
          | 'refresh'
          | 'setup'
          | 'unlock'
          | 'lock'
          | 'import'
          | 'create'
          | 'activate'
          | 'delete'
          | 'rename'
          | null),
    keystoreError: keystoreLifecycle.error,
    keystoreStatus,
    keystoreBadge,

    // ── Wallet state (from reusable hooks) ──
    wallets: keystoreWallets.wallets,
    activeWallet: keystoreAccounts.activeWallet,
    walletAccounts: keystoreAccounts.accounts,
    walletNameDrafts,
    setWalletNameDrafts,
    walletActionId: null as string | null,

    // ── Account state (from reusable hooks) ──
    accountsBusy: null as 'refresh' | 'activate' | null,
    accountsError: keystoreAccounts.error,
    accountActionIndex: null as number | null,

    // ── Identity (from reusable hooks) ──
    readyForWrite: identity !== null,

    // ── Keystore actions (from reusable hooks) ──
    setup: keystoreLifecycle.setup,
    unlock: keystoreLifecycle.unlock,
    lock: keystoreLifecycle.lock,
    refresh: keystoreLifecycle.refresh,
    activateWallet: keystoreWallets.activateWallet,
    addWallet: keystoreWallets.addWallet,
    deleteWallet: keystoreWallets.deleteWallet,
    renameWallet: keystoreWallets.renameWallet,
    activateAccount: keystoreAccounts.activateAccount,
    refreshKeystore,

    // ── No-op setters kept for backward compat with devnode action helpers ──
    setKeystoreBusy: (_busy: unknown) => {},
    setKeystoreError: (_msg: string | null) => {},
    setWalletActionId: (_id: string | null) => {},
    setAccountsBusy: (_busy: unknown) => {},
    setAccountsError: (_err: string | null) => {},
    setAccountActionIndex: (_idx: number | null) => {},

    // ── Devnode state ──
    devnode,
    devnodeBusy,
    devnodeError,
    devnodeBadge,
    devnodeAccounts,
    faucet,
    faucetBusy,
    faucetError,
    setDevnode,
    setDevnodeBusy,
    setDevnodeError,
    setFaucetBusy,
    setFaucetError,
    refreshDevnode,

    // ── Profile state ──
    nodeProfileActionId,
    nodeProfileBusy,
    nodeProfileError,
    nodeProfileLocked: Boolean(nodeProfileState?.locked),
    nodeProfiles: nodeProfileState?.profiles ?? [],
    selectedNodeProfile: nodeProfileState?.selectedProfile ?? null,
    setNodeProfileActionId,
    setNodeProfileBusy,
    setNodeProfileError,

    // ── Derived ──
    environmentFaucets: faucetLinksFor(network, space),
    localRpc: space === 'core' ? devnode?.urls?.core : devnode?.urls?.espace,
    localWriteBlocked: network === 'local' && !devnode?.running,
    selectedFaucet: faucetFor(network, space, devnodeAccounts),
  };
}

export type ShowcaseWorkspaceKeystoreRuntime = ReturnType<
  typeof useShowcaseWorkspaceKeystoreRuntime
>;
