import { errMsg } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Abi, Hex } from 'viem';
import { useAccount, useDeployContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  api,
  type CatalogEntry,
  type CompileTemplateResponse,
  type TemplateMetaResponse,
} from '../lib/api.js';
import { CompilerCatalogSection } from './compiler-catalog-section.js';
import { CompilerWorkflowSection } from './compiler-workflow-section.js';

function coerceArg(type: string, raw: string): unknown {
  if (type === 'string') return raw;
  if (type === 'bool') return raw === 'true' || raw === '1';
  if (type === 'address') return raw as Hex;
  if (type.startsWith('uint') || type.startsWith('int')) return BigInt(raw);
  return raw;
}

export function CompilerPanel() {
  const { address, isConnected } = useAccount();
  const [templates, setTemplates] = useState<TemplateMetaResponse[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [sources, setSources] = useState<Record<string, string>>({});
  const [edited, setEdited] = useState(false);
  const [artifact, setArtifact] = useState<CompileTemplateResponse | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [compileErr, setCompileErr] = useState<string | null>(null);
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const { deployContractAsync } = useDeployContract();
  const [deployHash, setDeployHash] = useState<Hex | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [deployErr, setDeployErr] = useState<string | null>(null);
  const { data: receipt, isFetching: awaitingReceipt } = useWaitForTransactionReceipt({
    hash: deployHash ?? undefined,
  });
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogErr, setCatalogErr] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogDeployHash, setCatalogDeployHash] = useState<Hex | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    api
      .compileTemplates(ac.signal)
      .then((response) => {
        setTemplates(response.templates);
        const first = response.templates[0];
        if (first && !selectedId) setSelectedId(first.id);
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== 'AbortError') setLoadErr(errMsg(error));
      });
    return () => ac.abort();
  }, [selectedId]);

  const tpl = useMemo(
    () => templates?.find((template) => template.id === selectedId) ?? null,
    [templates, selectedId],
  );
  useEffect(() => {
    if (!tpl) return;
    setSources(Object.fromEntries(tpl.sources.map((source) => [source.path, source.content])));
    setEdited(false);
    setArtifact(null);
    setCompileErr(null);
    setDeployHash(null);
    setArgValues(Object.fromEntries(tpl.constructorArgs.map((arg) => [arg.name, ''])));
  }, [tpl]);

  const activeSource = Object.entries(sources)[0];
  const compile = useCallback(async () => {
    if (!tpl) return;
    setCompiling(true);
    setCompileErr(null);
    setArtifact(null);
    setDeployHash(null);
    try {
      const result = edited
        ? await api.compileSources({
            sources: Object.entries(sources).map(([path, content]) => ({ path, content })),
            contractName: tpl.contractName,
            solcVersion: tpl.solcVersion,
          })
        : await api.compile({ templateId: tpl.id });
      setArtifact(result);
    } catch (error) {
      setCompileErr(errMsg(error));
    } finally {
      setCompiling(false);
    }
  }, [tpl, edited, sources]);

  const deploy = useCallback(async () => {
    if (!artifact || !address) return;
    setDeploying(true);
    setDeployErr(null);
    setDeployHash(null);
    try {
      const abi = artifact.abi as Abi;
      const constructorDef = abi.find((item) => item.type === 'constructor') as
        | { inputs?: { name: string; type: string }[] }
        | undefined;
      const args =
        constructorDef?.inputs?.map((input) =>
          coerceArg(input.type, argValues[input.name] ?? ''),
        ) ?? [];
      setDeployHash(await deployContractAsync({ abi, bytecode: artifact.bytecode as Hex, args }));
    } catch (error) {
      setDeployErr(errMsg(error));
    } finally {
      setDeploying(false);
    }
  }, [artifact, address, argValues, deployContractAsync]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogErr(null);
    try {
      setCatalog((await api.compileCatalog()).entries);
    } catch (error) {
      setCatalogErr(errMsg(error));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const deployCatalogEntry = useCallback(
    async (entry: CatalogEntry) => {
      if (!address) return;
      setDeployErr(null);
      setCatalogDeployHash(null);
      try {
        setCatalogDeployHash(
          await deployContractAsync({
            abi: entry.abi as Abi,
            bytecode: entry.bytecode as Hex,
            args: [],
          }),
        );
      } catch (error) {
        setDeployErr(errMsg(error));
      }
    },
    [address, deployContractAsync],
  );

  return (
    <div>
      <CompilerWorkflowSection
        address={address}
        isConnected={isConnected}
        pickerOpen={pickerOpen}
        setPickerOpen={setPickerOpen}
        loadErr={loadErr}
        templates={templates}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        tpl={tpl}
        activeSource={activeSource}
        setSources={setSources}
        setEdited={setEdited}
        setArtifact={setArtifact}
        compiling={compiling}
        compile={() => void compile()}
        edited={edited}
        artifact={artifact}
        compileErr={compileErr}
        argValues={argValues}
        setArgValues={setArgValues}
        deploying={deploying}
        awaitingReceipt={awaitingReceipt}
        deploy={() => void deploy()}
        deployErr={deployErr}
        deployHash={deployHash}
        receipt={receipt}
      />
      <CompilerCatalogSection
        showCatalog={showCatalog}
        catalogLoading={catalogLoading}
        catalogErr={catalogErr}
        catalog={catalog}
        catalogDeployHash={catalogDeployHash}
        isConnected={isConnected}
        setShowCatalog={setShowCatalog}
        loadCatalog={() => void loadCatalog()}
        deployCatalogEntry={(entry) => void deployCatalogEntry(entry)}
      />
    </div>
  );
}
