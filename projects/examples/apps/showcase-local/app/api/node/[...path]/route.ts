import { NextResponse } from 'next/server';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return forward(request, 'GET');
}

export async function POST(request: Request) {
  return forward(request, 'POST');
}

export async function PUT(request: Request) {
  return forward(request, 'PUT');
}

async function forward(request: Request, method: 'GET' | 'POST' | 'PUT') {
  const path = new URL(request.url).pathname.split('/api/node/')[1] ?? '';
  if (!path) {
    return NextResponse.json(
      { error: 'Unknown node route', ok: false },
      { headers: noStoreHeaders(), status: 404 },
    );
  }

  const search = new URL(request.url).search;
  const body = method === 'GET' ? '' : await request.text();
  const headers = new Headers();
  if (body) {
    headers.set('content-type', request.headers.get('content-type') ?? 'application/json');
  }

  const response =
    body === ''
      ? await requestRuntime(`/node/${path}${search}`, { method })
      : await requestRuntime(`/node/${path}${search}`, {
          body,
          headers,
          method,
        });
  const payload = await readRuntimeJson<Record<string, unknown>>(response);

  return NextResponse.json(payload, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
