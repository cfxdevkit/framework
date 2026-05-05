import { readContract } from '@cfxdevkit/contracts/read';
import { sendWrite } from '@cfxdevkit/contracts/write';
import { useCallback, useMemo, useState } from 'react';
import type { Abi, AbiFunction } from 'viem';
import { useCompilerSession } from '../contexts/CompilerSession.js';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { useWallet } from '../contexts/WalletProvider.js';
import { validateAddress } from './contract-interaction-helpers.js';
import {
  toTarget,
  useActiveSession,
  useCallableFunctions,
  useGroupedDeployments,
} from './contract-interaction-hooks.js';
import { ModeTabs, SessionDeployments } from './contract-interaction-sections.js';
import { ManualContractForm, TargetContractCard } from './contract-target-sections.js';

export function ContractInteractionPanel() {
  const { signer } = useWallet();
  const { network, core, espace, coreClient, espaceClient } = useNetwork();
  // Inline space selector — pick Core or eSpace without a global toggle.
  const [localSpace, setLocalSpace] = useState<'core' | 'espace'>('espace');
  const chain = localSpace === 'core' ? core : espace;
  const client = localSpace === 'core' ? coreClient : espaceClient;
  const isCore = localSpace === 'core';
  const family: 'core' | 'espace' = localSpace;
  const { history, removeDeploy } = useCompilerSession();
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

      {/* Inline space selector */}
      <div className="row" style={{ marginBottom: 12, alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Space</span>
        <div className="seg">
          <button
            type="button"
            className={localSpace === 'espace' ? 'seg-item active' : 'seg-item'}
            onClick={() => setLocalSpace('espace')}
            title={`eSpace — EVM compatible (chain ${espace.id})`}
          >
            eSpace
          </button>
          <button
            type="button"
            className={localSpace === 'core' ? 'seg-item active' : 'seg-item'}
            onClick={() => setLocalSpace('core')}
            title={`Core Space (chain ${core.id})`}
          >
            Core
          </button>
        </div>
        <span className="muted" style={{ fontSize: 11 }}>
          chain {chain.id} · {chain.name}
        </span>
      </div>

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
