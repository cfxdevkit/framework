/**
 * NetworkContext — single source of truth for the "active network".
 *
 * Both the wagmi eSpace path and the use-wallet-react Core path read from
 * here so the user only has to pick a network once. The selection is
 * persisted to localStorage.
 *
 * Networks:
 *   mainnet — eSpace chainId 1030,  Core chainId 0x405 (1029)
 *   testnet — eSpace chainId 71,    Core chainId 0x1   (1)
 *   local   — disabled in browser showcase (no CORS proxy)
 */
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type NetworkId = 'mainnet' | 'testnet';

export interface NetworkSpec {
  id: NetworkId;
  label: string;
  /** wagmi / EVM chain id */
  espaceChainId: number;
  /** Fluent hex chain id for Core space, e.g. '0x405' */
  coreChainIdHex: string;
  /** Decimal Core chain id (for display) */
  coreChainIdDecimal: number;
}

export const NETWORKS: readonly NetworkSpec[] = Object.freeze([
  {
    id: 'mainnet',
    label: 'Mainnet',
    espaceChainId: 1030,
    coreChainIdHex: '0x405',
    coreChainIdDecimal: 1029,
  },
  {
    id: 'testnet',
    label: 'Testnet',
    espaceChainId: 71,
    coreChainIdHex: '0x1',
    coreChainIdDecimal: 1,
  },
]);

interface NetworkCtx {
  network: NetworkSpec;
  setNetwork: (id: NetworkId) => void;
}

const Ctx = createContext<NetworkCtx | null>(null);

const LS_KEY = 'showcase-browser.network';

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<NetworkId>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored === 'mainnet' || stored === 'testnet') return stored;
    } catch {
      // localStorage may be unavailable in some environments
    }
    return 'mainnet';
  });

  const setNetwork = useCallback((newId: NetworkId) => {
    try {
      localStorage.setItem(LS_KEY, newId);
    } catch {
      // ignore
    }
    setId(newId);
  }, []);

  const network: NetworkSpec = useMemo(
    () => NETWORKS.find((n) => n.id === id) ?? (NETWORKS[0] as NetworkSpec),
    [id],
  );

  return <Ctx.Provider value={{ network, setNetwork }}>{children}</Ctx.Provider>;
}

export function useNetwork(): NetworkCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNetwork must be used inside <NetworkProvider>');
  return ctx;
}
