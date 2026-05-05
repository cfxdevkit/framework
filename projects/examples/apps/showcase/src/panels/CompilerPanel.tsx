import { deployContract } from '@cfxdevkit/contracts/deploy';
import { useCallback, useState } from 'react';
import type { Abi, Hex } from 'viem';

import { useCompilerSession } from '../contexts/CompilerSession.js';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { useWallet } from '../contexts/WalletProvider.js';
import { api, type CatalogEntry } from '../lib/api.js';
import { CompilerArtifactSection } from './compiler-artifact-section.js';
import { CompilerCatalogHistorySection } from './compiler-catalog-history-section.js';
import { useCompilerCatalog } from './compiler-catalog-hook.js';
import { constructorValue } from './compiler-deploy-helpers.js';
import { CompilerTemplateSection } from './compiler-template-section.js';
import { useCompilerTemplateState } from './compiler-template-state.js';

export function CompilerPanel() {
  const { signer, accounts, activeIndex, connect } = useWallet();
  const { network, core, espace, coreClient, espaceClient } = useNetwork();
  // Local deploy-space selector — managed signer works for both chains simultaneously.
  const [deploySpace, setDeploySpace] = useState<'core' | 'espace'>('espace');
  const chain = deploySpace === 'core' ? core : espace;
  const client = deploySpace === 'core' ? coreClient : espaceClient;
  const isCore = deploySpace === 'core';

  const {
    artifact,
    setArtifact,
    selected,
    setSelected,
    argValues,
    setArgValues,
    history,
    pushDeploy,
    clearHistory,
  } = useCompilerSession();
  const [compiling, setCompiling] = useState(false);
  const [compileErr, setCompileErr] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [deployErr, setDeployErr] = useState<string | null>(null);
  const [deployedHash, setDeployedHash] = useState<string | null>(null);
  const {
    catalog,
    catalogLoading,
    catalogErr,
    catalogDeployingId,
    loadCatalog,
    deployFromCatalog,
  } = useCompilerCatalog({ signer, client, chain, network, argValues, pushDeploy, setDeployErr });
  const { templates, loadErr, tpl, sourceEdit, setSourceEdit, sourceDirty, resetSource } =
    useCompilerTemplateState({ selected, setSelected, argValues, setArgValues });

  const compile = useCallback(async () => {
    if (!selected || !tpl) return;
    setCompiling(true);
    setCompileErr(null);
    setArtifact(null);
    setDeployedHash(null);
    setDeployErr(null);
    try {
      const output = sourceDirty
        ? await api.compileSources({
            sources: tpl.sources.map((source) => ({
              path: source.path,
              content: sourceEdit[source.path] ?? source.content,
            })),
            contractName: tpl.contractName,
            solcVersion: tpl.solcVersion,
            evmVersion: 'paris',
          })
        : await api.compile({ templateId: selected });
      setArtifact(output);
    } catch (error) {
      setCompileErr(error instanceof Error ? error.message : String(error));
    } finally {
      setCompiling(false);
    }
  }, [selected, tpl, sourceDirty, sourceEdit, setArtifact]);

  const deployCompiled = useCallback(async () => {
    if (!signer || !artifact || !tpl) {
      setDeployErr('Compile first and connect a wallet on the Wallet tab.');
      return;
    }
    setDeploying(true);
    setDeployErr(null);
    setDeployedHash(null);
    try {
      const args = tpl.constructorArgs.map((arg) =>
        constructorValue(arg.name, arg.type, argValues[arg.name] ?? '', argValues),
      );
      const result = await deployContract({
        client,
        signer,
        abi: artifact.abi as Abi,
        bytecode: artifact.bytecode as Hex,
        args: args as never,
        waitForReceipt: true,
      });
      setDeployedHash(result.hash);
      if (result.address)
        pushDeploy({
          templateId: tpl.id,
          contractName: artifact.contractName,
          chainName: chain.name,
          family: chain.family as 'core' | 'espace',
          chainId: chain.id,
          networkId: network.id,
          address: result.address,
          hash: result.hash,
          deployer: signer.account.address,
          constructorArgs: args.map((value) =>
            typeof value === 'bigint' ? value.toString() : value,
          ),
          abi: artifact.abi as Abi,
        });
    } catch (error) {
      setDeployErr(error instanceof Error ? error.message : String(error));
    } finally {
      setDeploying(false);
    }
  }, [signer, artifact, tpl, argValues, client, chain, network, pushDeploy]);

  const templateProps = {
    templates,
    selected,
    setSelected,
    tpl,
    compiling,
    compile: () => void compile(),
    sourceEdit,
    setSourceEdit,
    sourceDirty,
    resetSource,
    argValues,
    setArgValues,
  };
  const artifactProps = {
    artifact,
    deploying,
    signer,
    chain,
    isCore,
    accountsLength: accounts.length,
    activeIndex,
    connect,
    deploy: () => void deployCompiled(),
    deployErr,
    deployedHash,
  };
  const catalogProps = {
    catalog,
    catalogLoading,
    catalogErr,
    catalogDeployingId,
    signer,
    isCore,
    loadCatalog: () => void loadCatalog(),
    deployFromCatalog: (entry: CatalogEntry) => void deployFromCatalog(entry),
    history,
    clearHistory,
  };

  return (
    <section className="panel">
      <h2>Compile + deploy</h2>
      <p className="panel-desc">
        Drives <code className="mono">@cfxdevkit/compiler</code> server-side via{' '}
        <code className="mono">/compile</code> on{' '}
        <code className="mono">@cfxdevkit/example-showcase-backend</code>, then deploys through{' '}
        <code className="mono">@cfxdevkit/contracts/deploy</code> with the active wallet signer.
      </p>

      {/* Inline deploy-space selector — no global space toggle required */}
      <div className="row" style={{ marginBottom: 12, alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Deploy to</span>
        <div className="seg">
          <button
            type="button"
            className={deploySpace === 'espace' ? 'seg-item active' : 'seg-item'}
            onClick={() => setDeploySpace('espace')}
            title={`eSpace — EVM compatible (chain ${espace.id})`}
          >
            eSpace
          </button>
          <button
            type="button"
            className={deploySpace === 'core' ? 'seg-item active' : 'seg-item'}
            onClick={() => setDeploySpace('core')}
            title={`Core Space (chain ${core.id})`}
          >
            Core
          </button>
        </div>
        <span className="muted" style={{ fontSize: 11 }}>
          chain {chain.id} · {chain.name}
        </span>
      </div>

      {loadErr && <p className="error">Failed to load templates: {loadErr}</p>}
      {!templates && !loadErr && <p className="muted">Loading templates…</p>}
      <CompilerTemplateSection {...templateProps} />
      {compileErr && <p className="error">{compileErr}</p>}
      <CompilerArtifactSection {...artifactProps} />
      <CompilerCatalogHistorySection {...catalogProps} />
    </section>
  );
}
