import { NextResponse } from 'next/server';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET() {
  const response = await requestRuntime('/accounts', { method: 'GET' });
  const body = await readRuntimeJson<Record<string, unknown>>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
