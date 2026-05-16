import { NextResponse } from 'next/server';
import type { DevnodeAccountSummary, DevnodeAccountsResponse } from '../../../../lib/devnode-types';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET() {
  const accountsResponse = await requestRuntime('/accounts', { method: 'GET' });
  const accountsBody = await readRuntimeJson<{
    ok: boolean;
    accounts: DevnodeAccountSummary[];
    error?: string;
  }>(accountsResponse);

  let faucet: DevnodeAccountSummary | undefined;

  if (accountsResponse.ok && accountsBody.accounts.length > 0) {
    const faucetResponse = await requestRuntime('/accounts/faucet', { method: 'GET' });
    if (faucetResponse.ok) {
      const faucetBody = await readRuntimeJson<{ ok: boolean; faucet: DevnodeAccountSummary }>(
        faucetResponse,
      );
      faucet = faucetBody.faucet;
    }
  }

  const body: DevnodeAccountsResponse = {
    ok: accountsBody.ok,
    accounts: accountsBody.accounts,
    ...(accountsBody.error ? { error: accountsBody.error } : {}),
    ...(faucet ? { faucet } : {}),
  };

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: accountsResponse.status,
  });
}
