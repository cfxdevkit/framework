'use client';

import type { DevnodeStatusResponse } from '../../../lib/devnode-types';
import { isErrorWithPayload } from '../../devnode/devnode-client';
import type { ShowcaseWorkspaceDrafts } from '../drafts';
import type { LocalFundResponse } from '../shared';
import type { ShowcaseWorkspaceKeystoreRuntime } from './runtime';

type WorkspaceLog = (message: string, level?: 'error') => void;

export async function runDevnodeAction(params: {
  action: 'start' | 'restart' | 'stop' | 'wipe' | 'mine';
  log: WorkspaceLog;
  request: () => Promise<DevnodeStatusResponse>;
  runtime: ShowcaseWorkspaceKeystoreRuntime;
  successMessage: (next: DevnodeStatusResponse) => string;
}) {
  const { action, log, request, runtime, successMessage } = params;
  runtime.setDevnodeBusy(action);
  runtime.setDevnodeError(null);
  try {
    const next = await request();
    runtime.setDevnode(next);
    runtime.setDevnodeError(next.error ?? null);
    await runtime.refreshKeystore({ silent: true });
    log(successMessage(next));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    runtime.setDevnodeError(message);
    if (isErrorWithPayload(error) && error.payload) runtime.setDevnode(error.payload);
    else await runtime.refreshDevnode({ silent: true });
    log(message, 'error');
  } finally {
    runtime.setDevnodeBusy(null);
  }
}

export async function runPassphraseAction(params: {
  action: 'setup' | 'unlock';
  drafts: ShowcaseWorkspaceDrafts;
  log: WorkspaceLog;
  request: (value: string) => Promise<unknown>;
  runtime: ShowcaseWorkspaceKeystoreRuntime;
  successMessage: string;
}) {
  const { drafts, log, request, successMessage } = params;
  const nextPassphrase = drafts.passphrase.trim();
  if (!nextPassphrase) {
    log('Passphrase is required.', 'error');
    return;
  }
  try {
    await request(nextPassphrase);
    log(successMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(message, 'error');
  }
}

export async function runLock(log: WorkspaceLog, runtime: ShowcaseWorkspaceKeystoreRuntime) {
  try {
    await runtime.lock();
    log('Locked keystore.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(message, 'error');
  }
}

export async function runLocalFund(
  drafts: ShowcaseWorkspaceDrafts,
  log: WorkspaceLog,
  runtime: ShowcaseWorkspaceKeystoreRuntime,
) {
  const address = drafts.faucetAddress.trim();
  const amount = drafts.faucetAmount.trim();
  if (!address) return void runtime.setFaucetError('Enter a local recipient address first.');
  if (!amount) return void runtime.setFaucetError('Enter an amount in CFX.');
  runtime.setFaucetBusy(true);
  runtime.setFaucetError(null);
  try {
    const response = await fetch('/api/devnode/accounts/fund', {
      body: JSON.stringify({ address, amount }),
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    const payload = (await response.json()) as LocalFundResponse;
    if (!response.ok) throw new Error(payload.error ?? 'POST /api/devnode/accounts/fund failed');
    log(
      `Funded ${address} on local ${payload.space === 'espace' ? 'eSpace' : 'Core'} with ${amount} CFX. Tx ${payload.txHash}.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    runtime.setFaucetError(message);
    log(message, 'error');
  } finally {
    runtime.setFaucetBusy(false);
  }
}
