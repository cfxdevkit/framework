import { NextResponse } from 'next/server';
import type { DevnodeProfileStateResponse } from '../../../../lib/devnode-types';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET() {
  const response = await requestRuntime('/node/profile', { method: 'GET' });
  const body = await readRuntimeJson<DevnodeProfileStateResponse>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
