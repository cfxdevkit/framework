import { NextResponse } from 'next/server';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const forwarded = await forwardJsonBody(request);
  const response =
    forwarded.body === null
      ? await requestRuntime('/contracts/read', { method: 'POST' })
      : await requestRuntime('/contracts/read', {
          body: forwarded.body,
          headers: forwarded.headers,
          method: 'POST',
        });
  const body = await readRuntimeJson<Record<string, unknown>>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}

async function forwardJsonBody(
  request: Request,
): Promise<{ body: string | null; headers: Headers }> {
  const body = await request.text();
  if (!body) {
    return { body: null, headers: new Headers() };
  }

  const headers = new Headers();
  headers.set('content-type', request.headers.get('content-type') ?? 'application/json');
  return { body, headers };
}
