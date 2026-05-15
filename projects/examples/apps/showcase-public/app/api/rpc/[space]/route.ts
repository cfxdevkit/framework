import { type NextRequest, NextResponse } from 'next/server';

const RPC_ENDPOINTS: Record<string, string> = {
  espace: 'https://evmtestnet.confluxrpc.com',
  core: 'https://test.confluxrpc.com',
};

// Simple in-memory token bucket rate limiter (10 req/s per IP)
const buckets = new Map<string, { tokens: number; lastRefill: number }>();
const RATE_LIMIT = 10;
const REFILL_INTERVAL_MS = 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip) ?? { tokens: RATE_LIMIT, lastRefill: now };
  const elapsed = now - bucket.lastRefill;
  const refilled = Math.floor((elapsed / REFILL_INTERVAL_MS) * RATE_LIMIT);
  bucket.tokens = Math.min(RATE_LIMIT, bucket.tokens + refilled);
  bucket.lastRefill = now;
  if (bucket.tokens < 1) {
    buckets.set(ip, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(ip, bucket);
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ space: string }> },
) {
  const { space } = await params;
  const endpoint = RPC_ENDPOINTS[space];
  if (!endpoint) {
    return NextResponse.json({ error: 'Invalid space' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: 200 });
}
