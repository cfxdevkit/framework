import { NextResponse } from 'next/server';
import type { KeystoreActionResponse } from '../../../../lib/keystore-types';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function POST() {
  const response = await requestRuntime('/keystore/lock', { method: 'POST' });
  const body = await readRuntimeJson<KeystoreActionResponse>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
