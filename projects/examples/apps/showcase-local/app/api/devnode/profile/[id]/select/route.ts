import { NextResponse } from 'next/server';
import type { DevnodeProfileSelectionResponse } from '../../../../../../lib/devnode-types';
import {
  noStoreHeaders,
  readRuntimeJson,
  requestRuntime,
} from '../../../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await requestRuntime(`/node/profile/${id}/select`, { method: 'PUT' });
  const body = await readRuntimeJson<DevnodeProfileSelectionResponse>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
