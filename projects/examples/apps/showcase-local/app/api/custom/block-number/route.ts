import { NextResponse } from 'next/server';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  const response = await requestRuntime(`/custom/block-number${search}`, { method: 'GET' });
  const body = await readRuntimeJson<Record<string, unknown>>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
