/**
 * NetworkProvider — owns the (mainnet / testnet / local) environment switch
 * and exposes Conflux's two co-existing spaces (Core + eSpace) as a single
 * value. Picks the matching `ChainConfig` for each space from
 * `@cfxdevkit/core`'s static catalog.
 *
 * For the local network, RPC calls are routed through the showcase-backend's
 * CORS-enabled proxy at `/rpc/{core,espace}` because xcfx does not serve
 * CORS preflight responses natively.
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
  space: Space;
  core: ChainConfig;
  espace: ChainConfig;
  coreClient: Client;
  espaceClient: Client;
  activeClient: Client;
  activeChain: ChainConfig;
  setNetwork: (id: NetworkId) => void;
  setSpace: (s: Space) => void;
}

const Ctx = createContext<NetworkState | null>(null);

const STORAGE_NET = 'showcase-stack.network';
const STORAGE_SPACE = 'showcase-stack.space';

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
  const u = new URL(window.location.href);
  u.searchParams.set(param, value);
  window.history.replaceState(null, '', u.toString());
}

const isNetworkId = (v: string): v is NetworkId =>
  v === 'mainnet' || v === 'testnet' || v === 'local';
const isSpace = (v: string): v is Space => v === 'core' || v === 'espace';

const BACKEND_BASE =
  (import.meta.env?.VITE_BACKEND_URL as string | undefined) ?? 'http://127.0.0.1:5174';

function transportUrl(networkId: NetworkId, space: Space): string | undefined {
  if (networkId !== 'local') return undefined;
  return `${BACKEND_BASE}/rpc/${space}`;
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkId, setNetworkIdRaw] = useState<NetworkId>(() =>
    readInitial('net', STORAGE_NET, isNetworkId, 'testnet'),
  );
  const [space, setSpaceRaw] = useState<Space>(() =>
    readInitial('space', STORAGE_SPACE, isSpace, 'espace'),
  );

  const network = useMemo<NetworkPair>(() => {
    const found = NETWORKS.find((n) => n.id === networkId);
    return found ?? (NETWORKS[1] as NetworkPair);
  }, [networkId]);

  const coreClient = useMemo(() => {
    const url = transportUrl(networkId, 'core');
    return createClient({
      chain: network.core,
      transport: http(url ? { url, timeoutMs: 10_000 } : { timeoutMs: 10_000 }),
    });
  }, [network.core, networkId]);

  const espaceClient = useMemo(() => {
    const url = transportUrl(networkId, 'espace');
    return createClient({
      chain: network.espace,
      transport: http(url ? { url, timeoutMs: 10_000 } : { timeoutMs: 10_000 }),
    });
  }, [network.espace, networkId]);

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
