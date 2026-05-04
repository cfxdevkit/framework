import { deployContract } from '@cfxdevkit/contracts/deploy';
import { useCallback, useState } from 'react';
import type { Abi, Hex } from 'viem';
import { useChain } from '../contexts/ChainProvider.js';
import { useCompilerSession } from '../contexts/CompilerSession.js';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { useWallet } from '../contexts/WalletProvider.js';
import { api, type CatalogEntry } from '../lib/api.js';
import { CompilerArtifactSection } from './compiler-artifact-section.js';
import { CompilerCatalogHistorySection } from './compiler-catalog-history-section.js';
import { constructorValue } from './compiler-deploy-helpers.js';
import { CompilerTemplateSection } from './compiler-template-section.js';
import { useCompilerTemplateState } from './compiler-template-state.js';

export function CompilerPanel() {
  const { signer, accounts, activeIndex, connect } = useWallet();
  const { chain, client } = useChain();
  const { network } = useNetwork();
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
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogErr, setCatalogErr] = useState<string | null>(null);
  const [catalogDeployingId, setCatalogDeployingId] = useState<string | null>(null);
  const isCore = chain.family === 'core';
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

  const loadCatalog = useCallback(async () => {
    if (catalog || catalogLoading) return;
    setCatalogLoading(true);
    setCatalogErr(null);
    try {
      setCatalog((await api.compileCatalog()).entries);
    } catch (error) {
      setCatalogErr(error instanceof Error ? error.message : String(error));
    } finally {
      setCatalogLoading(false);
    }
  }, [catalog, catalogLoading]);

  const deployFromCatalog = useCallback(
    async (entry: CatalogEntry) => {
      if (!signer) {
        setDeployErr('Connect a wallet on the Wallet tab.');
        return;
      }
      setCatalogDeployingId(entry.templateId);
      setDeployErr(null);
      try {
        const args = entry.constructorArgs.map((arg) =>
          constructorValue(arg.name, arg.type, argValues[arg.name] ?? '', argValues),
        );
        const result = await deployContract({
          client,
          signer,
          abi: entry.abi as Abi,
          bytecode: entry.bytecode as Hex,
          args: args as never,
          waitForReceipt: true,
        });
        if (result.address)
          pushDeploy({
            templateId: entry.templateId,
            contractName: entry.contractName,
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
            abi: entry.abi as Abi,
          });
      } catch (error) {
        setDeployErr(error instanceof Error ? error.message : String(error));
      } finally {
        setCatalogDeployingId(null);
      }
    },
    [signer, client, chain, network, argValues, pushDeploy],
  );

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
      {loadErr && <p className="error">Failed to load templates: {loadErr}</p>}
      {!templates && !loadErr && <p className="muted">Loading templates…</p>}
      <CompilerTemplateSection {...templateProps} />
      {compileErr && <p className="error">{compileErr}</p>}
      <CompilerArtifactSection {...artifactProps} />
      <CompilerCatalogHistorySection {...catalogProps} />
    </section>
  );
}
