/**
 * `useChain` shim — kept for backwards-compatibility with single-space
 * panels (CorePanel, ContractPanel, StatusPanel) that were written against
 * a one-chain-at-a-time model. Internally it now reads the *active space*
 * from {@link useNetwork} and exposes the matching `ChainConfig` + client.
 *
 * New panels should prefer `useNetwork()` directly so they can address
 * Core and eSpace simultaneously (Conflux's distinguishing feature).
 */
import type { ChainConfig, Client } from '@cfxdevkit/core';
import { type NetworkState, useNetwork } from './NetworkProvider.js';

export interface ChainState {
  /** All chains exposed at the active network (length 2 — Core + eSpace). */
  chains: ChainConfig[];
  /** The chain matching the active space. */
  chain: ChainConfig;
  /** Memoised client bound to {@link chain}. */
  client: Client;
  /** Switch active *space* by chain slug. */
  setChainName: (name: string) => void;
}

export function useChain(): ChainState {
  const n: NetworkState = useNetwork();
  const chains: ChainConfig[] = [n.core, n.espace];
  return {
    chains,
    chain: n.activeChain,
    client: n.activeClient,
    setChainName: (name) => {
      if (name === n.core.name) n.setSpace('core');
      else if (name === n.espace.name) n.setSpace('espace');
    },
  };
}
