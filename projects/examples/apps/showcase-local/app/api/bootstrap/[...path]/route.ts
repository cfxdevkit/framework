import { NextResponse } from 'next/server';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const path = readPath(request);
  const search = new URL(request.url).search;
  const response = await requestRuntime(`/bootstrap/${path}${search}`, { method: 'GET' });
  const body = await readRuntimeJson<Record<string, unknown>>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}

export async function POST(request: Request) {
  const path = readPath(request);
  const forwarded = await forwardJsonBody(request);
  const response =
    forwarded.body === null
      ? await requestRuntime(`/bootstrap/${path}`, { method: 'POST' })
      : await requestRuntime(`/bootstrap/${path}`, {
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

function readPath(request: Request): string {
  return new URL(request.url).pathname.split('/api/bootstrap/')[1] ?? '';
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
