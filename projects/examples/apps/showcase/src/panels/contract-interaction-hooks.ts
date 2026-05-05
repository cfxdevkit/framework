import { useMemo } from 'react';
import type { Abi, AbiFunction } from 'viem';
import type { DeployLogEntry, DeployNetworkId } from '../contexts/CompilerSession.js';
import type { InteractionTarget } from './contract-target-sections.js';

export function useGroupedDeployments(history: DeployLogEntry[]) {
  return useMemo(() => {
    const map = new Map<DeployNetworkId, Map<'core' | 'espace', DeployLogEntry[]>>();
    for (const entry of history) {
      if (!Array.isArray(entry.abi)) continue;
      const net = entry.networkId ?? 'custom';
      if (!map.has(net)) map.set(net, new Map());
      const byFamily = map.get(net) as Map<'core' | 'espace', DeployLogEntry[]>;
      if (!byFamily.has(entry.family)) byFamily.set(entry.family, []);
      (byFamily.get(entry.family) as DeployLogEntry[]).push(entry);
    }
    return map;
  }, [history]);
}

export function useActiveSession({
  history,
  selectedId,
  networkId,
  family,
}: {
  history: DeployLogEntry[];
  selectedId: string;
  networkId: DeployNetworkId;
  family: 'core' | 'espace';
}) {
  return useMemo<DeployLogEntry | null>(() => {
    if (selectedId) {
      const found = history.find((entry) => entry.id === selectedId);
      if (found) return found;
    }
    return (
      history.find((entry) => entry.networkId === networkId && entry.family === family) ??
      history[0] ??
      null
    );
  }, [history, selectedId, networkId, family]);
}

export function toTarget({
  mode,
  activeSession,
  manualParsed,
  chain,
  family,
  networkId,
}: {
  mode: 'session' | 'manual';
  activeSession: DeployLogEntry | null;
  manualParsed: { address: string; abi: Abi } | null;
  chain: { name: string; id: number };
  family: 'core' | 'espace';
  networkId: DeployNetworkId;
}): InteractionTarget | null {
  if (mode === 'session' && activeSession)
    return {
      address: activeSession.address,
      abi: activeSession.abi,
      name: activeSession.contractName,
      chainName: activeSession.chainName,
      family: activeSession.family,
      chainId: activeSession.chainId,
      networkId: activeSession.networkId,
    };
  if (mode === 'manual' && manualParsed)
    return {
      address: manualParsed.address,
      abi: manualParsed.abi,
      name: 'Manual',
      chainName: chain.name,
      family,
      chainId: chain.id,
      networkId,
    };
  return null;
}

export function useCallableFunctions(target: InteractionTarget | null) {
  return useMemo(() => {
    if (!target) return { reads: [] as AbiFunction[], writes: [] as AbiFunction[] };
    const functions = target.abi.filter((entry): entry is AbiFunction => entry.type === 'function');
    return {
      reads: functions.filter(
        (fn) => fn.stateMutability === 'view' || fn.stateMutability === 'pure',
      ),
      writes: functions.filter(
        (fn) => fn.stateMutability === 'nonpayable' || fn.stateMutability === 'payable',
      ),
    };
  }, [target]);
}
