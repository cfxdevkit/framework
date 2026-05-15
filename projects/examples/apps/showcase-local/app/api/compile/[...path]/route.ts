import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// TODO: Implement compile API in examples-showcase-local change.
export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
