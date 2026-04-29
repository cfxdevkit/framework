/**
 * Chain context — owns the currently selected chain (across all panels) and
 * a memoised `Client` for it. Lifts what was previously per-panel chain
 * state (in `ContractPanel`) into a single source of truth.
 *
 * The chain selector in `App.tsx` writes here; panels read via
 * {@link useChain} and never call `createClient` themselves.
 */
import { type ChainConfig, type Client, createClient, http, listChains } from '@cfxdevkit/core';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export interface ChainState {
  /** All known chains (no filtering — panels filter by family if they care). */
  chains: ChainConfig[];
  /** The currently selected chain. Always defined while children render. */
  chain: ChainConfig;
  /** Memoised client bound to {@link chain}. */
  client: Client;
  /** Switch active chain by `ChainConfig.name` (slug). */
  setChainName: (name: string) => void;
}

const Ctx = createContext<ChainState | null>(null);

export interface ChainProviderProps {
  /** Initial chain slug. Defaults to the first non-local chain. */
  defaultChainName?: string;
  children: ReactNode;
}

export function ChainProvider({ defaultChainName, children }: ChainProviderProps) {
  const chains = useMemo(() => listChains() as ChainConfig[], []);
  const initial = useMemo(() => {
    if (defaultChainName) {
      const m = chains.find((c) => c.name === defaultChainName);
      if (m) return m.name;
    }
    return (chains.find((c) => c.network !== 'local') ?? chains[0])?.name ?? '';
  }, [chains, defaultChainName]);

  const [chainName, setChainNameRaw] = useState<string>(initial);

  const chain = useMemo(
    () => chains.find((c) => c.name === chainName) ?? chains[0],
    [chains, chainName],
  );

  const client = useMemo<Client | null>(
    () => (chain ? createClient({ chain, transport: http({ timeoutMs: 10_000 }) }) : null),
    [chain],
  );

  const setChainName = useCallback((name: string) => setChainNameRaw(name), []);

  if (!chain || !client) {
    return <p className="error">No chains registered in @cfxdevkit/core.</p>;
  }

  const value: ChainState = { chains, chain, client, setChainName };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChain(): ChainState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useChain must be called inside <ChainProvider>');
  return v;
}
