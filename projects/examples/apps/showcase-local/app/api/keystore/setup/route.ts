import { NextResponse } from 'next/server';
import type { KeystoreActionResponse } from '../../../../lib/keystore-types';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}) as { passphrase?: string });
  const response = await requestRuntime('/keystore/setup', {
    body: JSON.stringify({ passphrase: payload.passphrase }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  const body = await readRuntimeJson<KeystoreActionResponse>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
