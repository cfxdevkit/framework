'use client';

import { StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import type {
  DevnodeAccountSummary,
  DevnodeProfileStateResponse,
  DevnodeStatusResponse,
} from '../../../lib/devnode-types';
import type {
  KeystoreActiveWalletSummary,
  KeystoreStatusResponse,
  KeystoreWalletAccountSummary,
  KeystoreWalletSummary,
} from '../../../lib/keystore-types';
import { fetchDevnodeProfiles, fetchDevnodeStatus } from '../../devnode/devnode-client';
import {
  fetchActiveKeystoreWallet,
  fetchDevnodeAccounts,
  fetchKeystoreStatus,
  fetchKeystoreWalletAccounts,
  fetchKeystoreWallets,
} from '../../keystore/keystore-client';
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
  const [devnode, setDevnode] = useState<DevnodeStatusResponse | null>(null);
  const [devnodeBusy, setDevnodeBusy] = useState<
    'refresh' | 'start' | 'restart' | 'stop' | 'mine' | null
  >(null);
  const [devnodeError, setDevnodeError] = useState<string | null>(null);
  const [keystoreStatus, setKeystoreStatus] = useState<KeystoreStatusResponse | null>(null);
  const [wallets, setWallets] = useState<KeystoreWalletSummary[]>([]);
  const [walletNameDrafts, setWalletNameDrafts] = useState<Record<string, string>>({});
  const [activeWallet, setActiveWallet] = useState<KeystoreActiveWalletSummary | null>(null);
  const [walletAccounts, setWalletAccounts] = useState<KeystoreWalletAccountSummary[]>([]);
  const [accountsBusy, setAccountsBusy] = useState<'refresh' | 'activate' | null>(null);
  const [accountActionIndex, setAccountActionIndex] = useState<number | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [nodeProfileState, setNodeProfileState] = useState<DevnodeProfileStateResponse | null>(
    null,
  );
  const [nodeProfileBusy, setNodeProfileBusy] = useState<'select' | null>(null);
  const [nodeProfileActionId, setNodeProfileActionId] = useState<string | null>(null);
  const [nodeProfileError, setNodeProfileError] = useState<string | null>(null);
  const [devnodeAccounts, setDevnodeAccounts] = useState<DevnodeAccountSummary[]>([]);
  const [faucet, setFaucet] = useState<DevnodeAccountSummary | null>(null);
  const [faucetBusy, setFaucetBusy] = useState(false);
  const [faucetError, setFaucetError] = useState<string | null>(null);
  const [keystoreBusy, setKeystoreBusy] = useState<
    | 'refresh'
    | 'setup'
    | 'unlock'
    | 'lock'
    | 'import'
    | 'create'
    | 'activate'
    | 'delete'
    | 'rename'
    | null
  >(null);
  const [walletActionId, setWalletActionId] = useState<string | null>(null);
  const [keystoreError, setKeystoreError] = useState<string | null>(null);

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

  const refreshKeystore = useCallback(
    async (options?: { logMessage?: string; silent?: boolean }) => {
      if (!options?.silent) setKeystoreBusy('refresh');
      try {
        const nextStatus = await fetchKeystoreStatus();
        setKeystoreStatus(nextStatus);
        const [nextActive, nextAccounts, nextProfiles] = await Promise.all([
          nextStatus.initialized && !nextStatus.locked
            ? fetchActiveKeystoreWallet().catch(() => ({ wallet: null }))
            : Promise.resolve({ wallet: null }),
          fetchDevnodeAccounts().catch(() => null),
          fetchDevnodeProfiles().catch(
            (error) =>
              ({
                error: error instanceof Error ? error.message : String(error),
                locked: Boolean(devnode?.running),
                ok: false,
                profiles: [],
                selectedProfile: null,
              }) satisfies DevnodeProfileStateResponse,
          ),
        ]);
        setActiveWallet(nextActive.wallet ?? null);
        setNodeProfileState(nextProfiles);
        setNodeProfileError(
          nextProfiles.ok ? null : (nextProfiles.error ?? 'Unable to load node profiles.'),
        );
        setDevnodeAccounts(nextAccounts?.accounts ?? []);
        setFaucet(nextAccounts?.faucet ?? null);
        if (nextActive.wallet?.id) {
          try {
            setAccountsBusy('refresh');
            const nextWalletAccounts = await fetchKeystoreWalletAccounts(nextActive.wallet.id);
            setWalletAccounts(nextWalletAccounts.accounts);
            setAccountsError(null);
          } catch (error) {
            setWalletAccounts([]);
            setAccountsError(error instanceof Error ? error.message : String(error));
          } finally {
            setAccountsBusy(null);
          }
        } else {
          setWalletAccounts([]);
          setAccountsError(null);
        }
        if (nextStatus.initialized && !nextStatus.locked) {
          const nextWallets = await fetchKeystoreWallets();
          setWallets(nextWallets.wallets);
        } else {
          setWallets([]);
        }
        setKeystoreError(null);
        if (options?.logMessage) log(options.logMessage);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setKeystoreError(message);
        log(message, 'error');
      } finally {
        if (!options?.silent) setKeystoreBusy(null);
      }
    },
    [devnode?.running, log],
  );

  useEffect(() => {
    void refreshDevnode({ logMessage: 'Loaded node status.' });
    void refreshKeystore({ logMessage: 'Loaded keystore state.' });
  }, [refreshDevnode, refreshKeystore]);

  useEffect(() => {
    setWalletNameDrafts((current) => syncWalletDrafts(current, wallets));
  }, [wallets]);

  const devnodeBadge = useMemo(() => {
    if (devnodeError || devnode?.status === 'error')
      return createElement(StatusBadge, { label: 'error', status: 'error' });
    if (devnode?.running) return createElement(StatusBadge, { label: 'running', status: 'ok' });
    if (devnodeBusy === 'refresh')
      return createElement(StatusBadge, { label: 'loading', status: 'pending' });
    return createElement(StatusBadge, { label: 'stopped', status: 'info' });
  }, [devnode, devnodeBusy, devnodeError]);

  const keystoreBadge = useMemo(() => {
    if (keystoreError) return createElement(StatusBadge, { label: 'error', status: 'error' });
    if (!keystoreStatus) return createElement(StatusBadge, { label: 'loading', status: 'pending' });
    if (!keystoreStatus.initialized)
      return createElement(StatusBadge, { label: 'setup required', status: 'info' });
    if (keystoreStatus.locked)
      return createElement(StatusBadge, { label: 'locked', status: 'pending' });
    if (activeWallet) return createElement(StatusBadge, { label: 'signer ready', status: 'ok' });
    return createElement(StatusBadge, { label: 'unlocked', status: 'info' });
  }, [activeWallet, keystoreError, keystoreStatus]);

  return {
    accountActionIndex,
    accountsBusy,
    accountsError,
    activeWallet,
    devnode,
    devnodeAccounts,
    devnodeBadge,
    devnodeBusy,
    devnodeError,
    environmentFaucets: faucetLinksFor(network, space),
    faucet,
    faucetBusy,
    faucetError,
    keystoreBadge,
    keystoreBusy,
    keystoreError,
    keystoreReady: Boolean(keystoreStatus?.initialized) && !keystoreStatus?.locked,
    keystoreStatus,
    localRpc: space === 'core' ? devnode?.urls?.core : devnode?.urls?.espace,
    localWriteBlocked: network === 'local' && !devnode?.running,
    nodeProfileActionId,
    nodeProfileBusy,
    nodeProfileError,
    nodeProfileLocked: Boolean(nodeProfileState?.locked),
    nodeProfiles: nodeProfileState?.profiles ?? [],
    readyForWrite:
      Boolean(activeWallet) && Boolean(keystoreStatus?.initialized) && !keystoreStatus?.locked,
    refreshDevnode,
    refreshKeystore,
    selectedFaucet: faucetFor(network, space, devnodeAccounts),
    selectedNodeProfile: nodeProfileState?.selectedProfile ?? null,
    setAccountActionIndex,
    setAccountsBusy,
    setAccountsError,
    setDevnode,
    setDevnodeBusy,
    setDevnodeError,
    setFaucetBusy,
    setFaucetError,
    setKeystoreBusy,
    setKeystoreError,
    setNodeProfileActionId,
    setNodeProfileBusy,
    setNodeProfileError,
    setWalletActionId,
    setWalletNameDrafts,
    walletAccounts,
    walletActionId,
    walletNameDrafts,
    wallets,
  };
}

export type ShowcaseWorkspaceKeystoreRuntime = ReturnType<
  typeof useShowcaseWorkspaceKeystoreRuntime
>;
