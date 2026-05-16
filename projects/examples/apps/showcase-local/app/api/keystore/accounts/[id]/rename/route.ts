import { NextResponse } from 'next/server';
import type {
  KeystoreActionResponse,
  RenameKeystoreWalletRequest,
} from '../../../../../../lib/keystore-types';
import {
  noStoreHeaders,
  readRuntimeJson,
  requestRuntime,
} from '../../../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await request.json().catch(() => ({}) as RenameKeystoreWalletRequest);
  const response = await requestRuntime(`/keystore/wallets/${id}/rename`, {
    body: JSON.stringify({ name: payload.name }),
    headers: { 'content-type': 'application/json' },
    method: 'PATCH',
  });
  const body = await readRuntimeJson<KeystoreActionResponse>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
