/**
 * NetworkProvider — owns the **(main / testnet / local)** environment switch
 * and exposes Conflux's two co-existing spaces (Core + eSpace) as a single
 * value. Picks the matching `ChainConfig` for each space from
 * `@cfxdevkit/core`'s static catalog.
 *
 * Persists the selection to `?net=` and `localStorage('showcaseNetwork')`
 * so deep links survive reload. The "active space" sub-state (`core` vs
 * `espace`) is similarly persisted as `?space=` so panels that only target
 * one space (CorePanel, ContractPanel) keep working through the legacy
 * {@link useChain} hook in `ChainProvider.tsx`.
 *
 * **Local network** uses ports the showcase-backend's `/devnode` lifecycle
 * spins up — see `src/components/DevNodePill.tsx`.
 */
import {
  type ChainConfig,
  type Client,
  coreSpaceLocal,
  coreSpaceMainnet,
  coreSpaceTestnet,
  createClient,
  espaceLocal,
  espaceMainnet,
  espaceTestnet,
  http,
} from '@cfxdevkit/core';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type NetworkId = 'mainnet' | 'testnet' | 'local';
export type Space = 'core' | 'espace';

export interface NetworkPair {
  id: NetworkId;
  label: string;
  description: string;
  core: ChainConfig;
  espace: ChainConfig;
}

export const NETWORKS: readonly NetworkPair[] = Object.freeze([
  {
    id: 'mainnet',
    label: 'Mainnet',
    description: 'Conflux production. Core 1029 / eSpace 1030.',
    core: coreSpaceMainnet,
    espace: espaceMainnet,
  },
  {
    id: 'testnet',
    label: 'Testnet',
    description: 'Public testnet. Core 1 / eSpace 71. Faucets available.',
    core: coreSpaceTestnet,
    espace: espaceTestnet,
  },
  {
    id: 'local',
    label: 'Local',
    description: 'Local devnode (Core 2029 / eSpace 2030) — managed via /devnode API.',
    core: coreSpaceLocal,
    espace: espaceLocal,
  },
]);

export interface NetworkState {
  network: NetworkPair;
  /** The "currently focused" space — used by single-space panels via {@link useChain}. */
  space: Space;
  /** ChainConfig for each space at the active network. */
  core: ChainConfig;
  espace: ChainConfig;
  /** Memoised clients, one per space. */
  coreClient: Client;
  espaceClient: Client;
  /** Convenience: the client matching {@link space}. */
  activeClient: Client;
  activeChain: ChainConfig;
  setNetwork: (id: NetworkId) => void;
  setSpace: (s: Space) => void;
}

const Ctx = createContext<NetworkState | null>(null);

const STORAGE_NET = 'showcase.network';
const STORAGE_SPACE = 'showcase.space';

function readInitial<T extends string>(
  param: string,
  storageKey: string,
  validate: (v: string) => v is T,
  fallback: T,
): T {
  if (typeof window === 'undefined') return fallback;
  const url = new URLSearchParams(window.location.search).get(param);
  if (url && validate(url)) return url;
  const stored = window.localStorage.getItem(storageKey);
  if (stored && validate(stored)) return stored;
  return fallback;
}

function writeUrlParam(param: string, value: string): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set(param, value);
  window.history.replaceState(null, '', url.toString());
}

const isNetworkId = (v: string): v is NetworkId =>
  v === 'mainnet' || v === 'testnet' || v === 'local';
const isSpace = (v: string): v is Space => v === 'core' || v === 'espace';

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkId, setNetworkIdRaw] = useState<NetworkId>(() =>
    readInitial('net', STORAGE_NET, isNetworkId, 'testnet'),
  );
  const [space, setSpaceRaw] = useState<Space>(() =>
    readInitial('space', STORAGE_SPACE, isSpace, 'espace'),
  );

  const network = useMemo<NetworkPair>(() => {
    const found = NETWORKS.find((n) => n.id === networkId);
    // NETWORKS is non-empty and `networkId` is constrained by `isNetworkId`
    // to one of the listed ids; the cast just satisfies
    // `noUncheckedIndexedAccess`.
    return found ?? (NETWORKS[1] as NetworkPair);
  }, [networkId]);

  const coreClient = useMemo(
    () => createClient({ chain: network.core, transport: http({ timeoutMs: 10_000 }) }),
    [network.core],
  );
  const espaceClient = useMemo(
    () => createClient({ chain: network.espace, transport: http({ timeoutMs: 10_000 }) }),
    [network.espace],
  );

  const setNetwork = useCallback((id: NetworkId) => {
    setNetworkIdRaw(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_NET, id);
      writeUrlParam('net', id);
    }
  }, []);

  const setSpace = useCallback((s: Space) => {
    setSpaceRaw(s);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_SPACE, s);
      writeUrlParam('space', s);
    }
  }, []);

  // Sync URL once on mount so the address bar reflects the resolved values
  // (matters when the user lands without ?net=/?space= but localStorage has
  // a non-default value).
  useEffect(() => {
    writeUrlParam('net', networkId);
    writeUrlParam('space', space);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space, networkId]);

  const activeClient = space === 'core' ? coreClient : espaceClient;
  const activeChain = space === 'core' ? network.core : network.espace;

  const value: NetworkState = {
    network,
    space,
    core: network.core,
    espace: network.espace,
    coreClient,
    espaceClient,
    activeClient,
    activeChain,
    setNetwork,
    setSpace,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNetwork(): NetworkState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNetwork must be called inside <NetworkProvider>');
  return v;
}
