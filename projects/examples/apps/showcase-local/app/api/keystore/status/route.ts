import { NextResponse } from 'next/server';
import type { KeystoreStatusResponse } from '../../../../lib/keystore-types';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET() {
  const response = await requestRuntime('/keystore/status', { method: 'GET' });
  const body = await readRuntimeJson<KeystoreStatusResponse>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
