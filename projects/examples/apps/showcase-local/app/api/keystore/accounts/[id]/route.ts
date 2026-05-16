import { NextResponse } from 'next/server';
import type { KeystoreActionResponse } from '../../../../../lib/keystore-types';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await requestRuntime(`/keystore/wallets/${id}`, { method: 'DELETE' });
  const body = await readRuntimeJson<KeystoreActionResponse>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
