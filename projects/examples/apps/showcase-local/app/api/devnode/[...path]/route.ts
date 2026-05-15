import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// TODO: Implement devnode API proxy in examples-showcase-local change.
export async function GET() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
