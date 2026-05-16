import { NextResponse } from 'next/server';
import { noStoreHeaders, runShowcaseDevnodeAction } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function POST() {
  const result = await runShowcaseDevnodeAction('/node/restart');

  return NextResponse.json(result.body, {
    headers: noStoreHeaders(),
    status: result.status,
  });
}
