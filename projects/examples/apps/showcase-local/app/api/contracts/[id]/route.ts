import { NextResponse } from 'next/server';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await requestRuntime(`/contracts/${id}`, { method: 'GET' });
  const body = await readRuntimeJson<Record<string, unknown>>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await requestRuntime(`/contracts/${id}`, { method: 'DELETE' });
  const body = await readRuntimeJson<Record<string, unknown>>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
