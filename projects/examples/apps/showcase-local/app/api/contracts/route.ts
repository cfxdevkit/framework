import { NextResponse } from 'next/server';
import type { ShowcaseContractsResponse } from '../../../lib/contracts-types';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  const response = await requestRuntime(`/contracts${search}`, { method: 'GET' });
  const body = await readRuntimeJson<ShowcaseContractsResponse>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
