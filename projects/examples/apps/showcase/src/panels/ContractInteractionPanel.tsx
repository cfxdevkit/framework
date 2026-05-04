import { readContract } from '@cfxdevkit/contracts/read';
import { sendWrite } from '@cfxdevkit/contracts/write';
import { useCallback, useMemo, useState } from 'react';
import type { Abi, AbiFunction } from 'viem';
import { useChain } from '../contexts/ChainProvider.js';
import {
  type DeployLogEntry,
  type DeployNetworkId,
  useCompilerSession,
} from '../contexts/CompilerSession.js';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { useWallet } from '../contexts/WalletProvider.js';
import { validateAddress } from './contract-interaction-helpers.js';
import { ModeTabs, SessionDeployments } from './contract-interaction-sections.js';
import {
  type InteractionTarget,
  ManualContractForm,
  TargetContractCard,
} from './contract-target-sections.js';

export function ContractInteractionPanel() {
  const { signer } = useWallet();
  const { chain, client } = useChain();
  const { network } = useNetwork();
  const { history, removeDeploy } = useCompilerSession();
  const isCore = chain.family === 'core';
  const family: 'core' | 'espace' = isCore ? 'core' : 'espace';
  const grouped = useGroupedDeployments(history);
  const [mode, setMode] = useState<'session' | 'manual'>('session');
  const [selectedId, setSelectedId] = useState<string>('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualAbiText, setManualAbiText] = useState('');
  const [manualErr, setManualErr] = useState<string | null>(null);
  const [manualParsed, setManualParsed] = useState<{ address: string; abi: Abi } | null>(null);
  const activeSession = useActiveSession({ history, selectedId, networkId: network.id, family });
  const target = useMemo(
    () => toTarget({ mode, activeSession, manualParsed, chain, family, networkId: network.id }),
    [mode, activeSession, manualParsed, chain, family, network.id],
  );
  const wrongChain = target ? target.chainId !== chain.id || target.family !== family : false;
  const { reads, writes } = useCallableFunctions(target);

  const loadManual = useCallback(() => {
    setManualErr(null);
    const addrErr = validateAddress(manualAddress, family);
    if (addrErr) {
      setManualErr(addrErr);
      setManualParsed(null);
      return;
    }
    try {
      const parsed = JSON.parse(manualAbiText);
      if (!Array.isArray(parsed)) throw new Error('ABI must be a JSON array.');
      setManualParsed({ address: manualAddress.trim(), abi: parsed as Abi });
    } catch (error) {
      setManualErr(error instanceof Error ? `Invalid ABI JSON: ${error.message}` : String(error));
      setManualParsed(null);
    }
  }, [manualAddress, manualAbiText, family]);

  const runRead = useCallback(
    async (fn: AbiFunction, args: unknown[]) => {
      if (!target) throw new Error('No contract selected.');
      return readContract({
        client,
        address: target.address,
        abi: target.abi,
        functionName: fn.name,
        args,
      } as Parameters<typeof readContract>[0]);
    },
    [client, target],
  );

  const runWrite = useCallback(
    async (fn: AbiFunction, args: unknown[]) => {
      if (!target) throw new Error('No contract selected.');
      if (!signer) throw new Error('No signer connected.');
      return sendWrite({
        client,
        signer,
        address: target.address as `0x${string}`,
        abi: target.abi,
        functionName: fn.name,
        args,
        waitForReceipt: true,
      } as Parameters<typeof sendWrite>[0]);
    },
    [client, signer, target],
  );

  return (
    <section className="panel">
      <h2>Contract interaction</h2>
      <p className="panel-desc">
        Generic ABI-driven read/write console mirroring the VS Code extension ABI call commands.
        Deployments are persisted in <code className="mono">localStorage</code> and grouped by
        environment.
      </p>
      <ModeTabs mode={mode} setMode={setMode} historyLength={history.length} />
      {mode === 'session' && (
        <div style={{ marginTop: 12 }}>
          <SessionDeployments
            history={history}
            grouped={grouped}
            activeSession={activeSession}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            removeDeploy={removeDeploy}
          />
        </div>
      )}
      {mode === 'manual' && (
        <ManualContractForm
          isCore={isCore}
          manualAddress={manualAddress}
          setManualAddress={setManualAddress}
          manualAbiText={manualAbiText}
          setManualAbiText={setManualAbiText}
          loadManual={loadManual}
          manualParsed={manualParsed}
          manualErr={manualErr}
        />
      )}
      {target && (
        <TargetContractCard
          target={target}
          wrongChain={wrongChain}
          chainName={chain.name}
          chainId={chain.id}
          reads={reads}
          writes={writes}
          isCore={isCore}
          signerReady={!!signer}
          runRead={runRead}
          runWrite={runWrite}
        />
      )}
    </section>
  );
}

function useGroupedDeployments(history: DeployLogEntry[]) {
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

function useActiveSession({
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

function toTarget({
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

function useCallableFunctions(target: InteractionTarget | null) {
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
