'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ShowcaseContractRecord } from '../../lib/contracts-types';
import { fetchContracts } from '../contracts/contracts-client';
import {
  runCompileAction,
  runDeployAction,
  runIssueSessionAction,
  runReadBlockNumberAction,
  runVerifySessionAction,
} from './compose-actions';
import type { ShowcaseWorkspaceDrafts } from './drafts';
import type {
  CompileArtifact,
  CustomBlockNumberResponse,
  DeployResponse,
  SessionKeyIssueResponse,
  SessionKeyVerifyResponse,
} from './shared';
import { appendDelimitedValue, chainIdFor, extractContractFunctions } from './shared';

type WorkspaceLog = (message: string, level?: 'error') => void;

export function useShowcaseWorkspaceCompose({
  closeDialog,
  drafts,
  log,
}: {
  closeDialog(): void;
  drafts: ShowcaseWorkspaceDrafts;
  log: WorkspaceLog;
}) {
  const [artifact, setArtifact] = useState<CompileArtifact | null>(null);
  const [compileBusy, setCompileBusy] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [deployBusy, setDeployBusy] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<DeployResponse | null>(null);
  const [contracts, setContracts] = useState<ShowcaseContractRecord[]>([]);
  const [contractsBusy, setContractsBusy] = useState(false);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [sessionBusy, setSessionBusy] = useState<'idle' | 'issuing' | 'verifying'>('idle');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [issuedSession, setIssuedSession] = useState<SessionKeyIssueResponse | null>(null);
  const [sessionVerify, setSessionVerify] = useState<SessionKeyVerifyResponse | null>(null);
  const [customBlockBusy, setCustomBlockBusy] = useState(false);
  const [customBlockError, setCustomBlockError] = useState<string | null>(null);
  const [customBlockResult, setCustomBlockResult] = useState<CustomBlockNumberResponse | null>(
    null,
  );

  const refreshContracts = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setContractsBusy(true);
      try {
        const next = await fetchContracts({
          chainId: chainIdFor(drafts.network, drafts.space),
          network: drafts.network,
          space: drafts.space,
        });
        setContracts([...next.contracts].sort((left, right) => right.deployedAt - left.deployedAt));
        setContractsError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setContracts([]);
        setContractsError(message);
        if (!options?.silent) log(message, 'error');
      } finally {
        if (!options?.silent) setContractsBusy(false);
      }
    },
    [drafts.network, drafts.space, log],
  );

  useEffect(() => {
    void refreshContracts({ silent: true });
  }, [refreshContracts]);

  useEffect(() => {
    if (contracts.length === 0) {
      setSelectedContractId(null);
      return;
    }
    if (!selectedContractId || !contracts.some((contract) => contract.id === selectedContractId)) {
      setSelectedContractId(contracts[0]?.id ?? null);
    }
  }, [contracts, selectedContractId]);

  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.id === selectedContractId) ?? contracts[0] ?? null,
    [contracts, selectedContractId],
  );
  const selectedContractFunctions = useMemo(
    () => extractContractFunctions(selectedContract?.abi ?? []),
    [selectedContract],
  );

  const runCompile = async () => {
    await runCompileAction({
      closeDialog,
      drafts,
      log,
      setArtifact,
      setCompileBusy,
      setCompileError,
      setDeployResult,
    });
  };

  const runDeploy = async () => {
    await runDeployAction({
      artifact,
      closeDialog,
      drafts,
      log,
      refreshContracts,
      setDeployBusy,
      setDeployError,
      setDeployResult,
    });
  };

  const runIssueSession = async () => {
    await runIssueSessionAction({
      closeDialog,
      drafts,
      log,
      setIssuedSession,
      setSessionBusy,
      setSessionError,
      setSessionVerify,
    });
  };

  const runVerifySession = async () => {
    await runVerifySessionAction({
      drafts,
      issuedSession,
      log,
      setSessionBusy,
      setSessionError,
      setSessionVerify,
    });
  };

  const runReadBlockNumber = async () => {
    await runReadBlockNumberAction({
      closeDialog,
      drafts,
      log,
      setCustomBlockBusy,
      setCustomBlockError,
      setCustomBlockResult,
    });
  };

  return {
    artifact,
    compileBusy,
    compileError,
    contracts,
    contractsBusy,
    contractsError,
    customBlockBusy,
    customBlockError,
    customBlockResult,
    deployBusy,
    deployError,
    deployResult,
    issuedSession,
    loadSelectedContractIntoSession: () => {
      if (!selectedContract) return;
      drafts.setSessionContracts((current) =>
        appendDelimitedValue(current, selectedContract.address),
      );
      log(`Added ${selectedContract.name} to the session-key contract scope.`);
    },
    refreshContracts,
    runCompile,
    runDeploy,
    runIssueSession,
    runReadBlockNumber,
    runVerifySession,
    selectedContract,
    selectedContractFunctions,
    selectedContractId,
    sessionBusy,
    sessionError,
    sessionVerify,
    setSelectedContractId,
  };
}

export type ShowcaseWorkspaceCompose = ReturnType<typeof useShowcaseWorkspaceCompose>;
