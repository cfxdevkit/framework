import { NextResponse } from 'next/server';
import type { DevnodeMineRequest } from '../../../../lib/devnode-types';
import { noStoreHeaders, runShowcaseDevnodeAction } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await readJson<DevnodeMineRequest>(request);
  const count = body.count ?? 1;

  if (!Number.isInteger(count) || count < 1 || count > 100) {
    return NextResponse.json(
      { error: 'count must be an integer between 1 and 100' },
      { status: 400 },
    );
  }

  const result = await runShowcaseDevnodeAction('/node/mine', { blocks: count });
  return NextResponse.json(result.body, {
    headers: noStoreHeaders(),
    status: result.status,
  });
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return (body && typeof body === 'object' ? body : {}) as T;
  } catch {
    return {} as T;
  }
}
