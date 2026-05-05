import { deployContract } from '@cfxdevkit/contracts/deploy';
import { useCallback, useState } from 'react';
import type { Abi, Hex } from 'viem';
import type { DeployLogEntry, DeployNetworkId } from '../contexts/CompilerSession.js';
import { api, type CatalogEntry } from '../lib/api.js';
import { constructorValue } from './compiler-deploy-helpers.js';

type CatalogDeps = {
  signer: Parameters<typeof deployContract>[0]['signer'] | null;
  client: Parameters<typeof deployContract>[0]['client'];
  chain: { name: string; id: number; family: string };
  network: { id: DeployNetworkId };
  argValues: Record<string, string>;
  pushDeploy: (entry: Omit<DeployLogEntry, 'id' | 'ts'>) => void;
  setDeployErr: (err: string | null) => void;
};

export function useCompilerCatalog({
  signer,
  client,
  chain,
  network,
  argValues,
  pushDeploy,
  setDeployErr,
}: CatalogDeps) {
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogErr, setCatalogErr] = useState<string | null>(null);
  const [catalogDeployingId, setCatalogDeployingId] = useState<string | null>(null);

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
    [signer, client, chain, network, argValues, pushDeploy, setDeployErr],
  );

  return {
    catalog,
    catalogLoading,
    catalogErr,
    catalogDeployingId,
    loadCatalog,
    deployFromCatalog,
  };
}
