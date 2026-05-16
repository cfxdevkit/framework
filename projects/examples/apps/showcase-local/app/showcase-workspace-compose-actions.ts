'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { ShowcaseWorkspaceDrafts } from './showcase-workspace-drafts';
import type {
  CompileArtifact,
  CustomBlockNumberResponse,
  DeployResponse,
  SessionKeyIssueResponse,
  SessionKeyVerifyResponse,
} from './showcase-workspace-shared';
import {
  chainIdFor,
  displayNetwork,
  isAddressLike,
  isSelectorLike,
  normalizedTtl,
  requestWorkspace,
  splitValues,
} from './showcase-workspace-shared';

type WorkspaceLog = (message: string, level?: 'error') => void;

interface ComposeActionBase {
  closeDialog(): void;
  drafts: ShowcaseWorkspaceDrafts;
  log: WorkspaceLog;
}

type RefreshContracts = (options?: { silent?: boolean }) => Promise<void>;

export async function runCompileAction({
  closeDialog,
  drafts,
  log,
  setArtifact,
  setCompileBusy,
  setCompileError,
  setDeployResult,
}: ComposeActionBase & {
  setArtifact: Dispatch<SetStateAction<CompileArtifact | null>>;
  setCompileBusy: Dispatch<SetStateAction<boolean>>;
  setCompileError: Dispatch<SetStateAction<string | null>>;
  setDeployResult: Dispatch<SetStateAction<DeployResponse | null>>;
}): Promise<void> {
  const trimmedSource = drafts.source.trim();
  const trimmedName = drafts.contractName.trim();
  if (!trimmedSource || !trimmedName) {
    const message = 'Contract name and source are required.';
    setCompileError(message);
    log(message, 'error');
    return;
  }

  setCompileBusy(true);
  setCompileError(null);
  setArtifact(null);
  setDeployResult(null);

  try {
    const result = await requestWorkspace<CompileArtifact>('/api/compile/sources', {
      body: JSON.stringify({
        contractName: trimmedName,
        solcVersion: drafts.solcVersion.trim(),
        source: drafts.source,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    setArtifact(result);
    closeDialog();
    log(`Compiled ${result.contractName} with solc ${drafts.solcVersion.trim() || '0.8.26'}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setCompileError(message);
    log(message, 'error');
  } finally {
    setCompileBusy(false);
  }
}

export async function runDeployAction({
  artifact,
  closeDialog,
  drafts,
  log,
  refreshContracts,
  setDeployBusy,
  setDeployError,
  setDeployResult,
}: ComposeActionBase & {
  artifact: CompileArtifact | null;
  refreshContracts: RefreshContracts;
  setDeployBusy: Dispatch<SetStateAction<boolean>>;
  setDeployError: Dispatch<SetStateAction<string | null>>;
  setDeployResult: Dispatch<SetStateAction<DeployResponse | null>>;
}): Promise<void> {
  if (!artifact) {
    const message = 'Compile a contract before deploying.';
    setDeployError(message);
    log(message, 'error');
    return;
  }

  setDeployBusy(true);
  setDeployError(null);
  setDeployResult(null);

  try {
    const result = await requestWorkspace<DeployResponse>('/api/deploy/run', {
      body: JSON.stringify({
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        contractName: artifact.contractName,
        network: drafts.network,
        space: drafts.space,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    setDeployResult(result);
    await refreshContracts({ silent: true });
    closeDialog();
    log(
      result.address
        ? `Deployed ${artifact.contractName} to ${drafts.network}/${drafts.space} at ${result.address}.`
        : `Broadcast deployment to ${drafts.network}/${drafts.space}: ${result.hash}.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setDeployError(message);
    log(message, 'error');
  } finally {
    setDeployBusy(false);
  }
}

export async function runIssueSessionAction({
  closeDialog,
  drafts,
  log,
  setIssuedSession,
  setSessionBusy,
  setSessionError,
  setSessionVerify,
}: ComposeActionBase & {
  setIssuedSession: Dispatch<SetStateAction<SessionKeyIssueResponse | null>>;
  setSessionBusy: Dispatch<SetStateAction<'idle' | 'issuing' | 'verifying'>>;
  setSessionError: Dispatch<SetStateAction<string | null>>;
  setSessionVerify: Dispatch<SetStateAction<SessionKeyVerifyResponse | null>>;
}): Promise<void> {
  setSessionBusy('issuing');
  setSessionError(null);
  setIssuedSession(null);
  setSessionVerify(null);

  try {
    const result = await requestWorkspace<SessionKeyIssueResponse>('/api/session-key/issue', {
      body: JSON.stringify({
        capability: {
          chains: [chainIdFor(drafts.network, drafts.space)],
          contracts: splitValues(drafts.sessionContracts, isAddressLike),
          maxValuePerTx: drafts.sessionMaxValue.trim(),
          notAfter: Date.now() + normalizedTtl(drafts.sessionTtlMinutes) * 60_000,
          selectors: splitValues(drafts.sessionSelectors, isSelectorLike),
        },
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    setIssuedSession(result);
    closeDialog();
    log(`Issued a session key scoped to chain ${chainIdFor(drafts.network, drafts.space)}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setSessionError(message);
    log(message, 'error');
  } finally {
    setSessionBusy('idle');
  }
}

export async function runVerifySessionAction({
  drafts,
  issuedSession,
  log,
  setSessionBusy,
  setSessionError,
  setSessionVerify,
}: Omit<ComposeActionBase, 'closeDialog'> & {
  issuedSession: SessionKeyIssueResponse | null;
  setSessionBusy: Dispatch<SetStateAction<'idle' | 'issuing' | 'verifying'>>;
  setSessionError: Dispatch<SetStateAction<string | null>>;
  setSessionVerify: Dispatch<SetStateAction<SessionKeyVerifyResponse | null>>;
}): Promise<void> {
  if (!issuedSession) {
    return;
  }

  setSessionBusy('verifying');
  setSessionError(null);
  setSessionVerify(null);

  try {
    const result = await requestWorkspace<SessionKeyVerifyResponse>('/api/session-key/verify', {
      body: JSON.stringify({
        capability: {
          chains: [chainIdFor(drafts.network, drafts.space)],
          contracts: splitValues(drafts.sessionContracts, isAddressLike),
          maxValuePerTx: drafts.sessionMaxValue.trim(),
          notAfter: Date.now() + normalizedTtl(drafts.sessionTtlMinutes) * 60_000,
          selectors: splitValues(drafts.sessionSelectors, isSelectorLike),
        },
        parent: issuedSession.parent,
        session: issuedSession.session,
        signature: issuedSession.attestation.signature,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    setSessionVerify(result);
    log(`Verified session-key attestation: ${String(result.valid)}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setSessionError(message);
    log(message, 'error');
  } finally {
    setSessionBusy('idle');
  }
}

export async function runReadBlockNumberAction({
  closeDialog,
  drafts,
  log,
  setCustomBlockBusy,
  setCustomBlockError,
  setCustomBlockResult,
}: ComposeActionBase & {
  setCustomBlockBusy: Dispatch<SetStateAction<boolean>>;
  setCustomBlockError: Dispatch<SetStateAction<string | null>>;
  setCustomBlockResult: Dispatch<SetStateAction<CustomBlockNumberResponse | null>>;
}): Promise<void> {
  setCustomBlockBusy(true);
  setCustomBlockError(null);

  try {
    const params = new URLSearchParams({ network: drafts.network, space: drafts.space });
    const result = await requestWorkspace<CustomBlockNumberResponse>(
      `/api/custom/block-number?${params.toString()}`,
      { method: 'GET' },
    );
    setCustomBlockResult(result);
    closeDialog();
    log(
      `Custom backend action read head ${result.head} for ${displayNetwork(result.network)} / ${result.space === 'espace' ? 'eSpace' : 'Core'}.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setCustomBlockError(message);
    log(message, 'error');
  } finally {
    setCustomBlockBusy(false);
  }
}
