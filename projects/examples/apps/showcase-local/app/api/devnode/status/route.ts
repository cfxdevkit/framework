import { NextResponse } from 'next/server';
import { getShowcaseDevnodeStatus, noStoreHeaders } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(await getShowcaseDevnodeStatus(), {
    headers: noStoreHeaders(),
  });
}
