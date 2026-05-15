import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// TODO: Implement deploy API in examples-showcase-local change.
export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
