import { generateSiweNonce } from '@cfxdevkit/wallet-connect/siwe';
import { type NextRequest, NextResponse } from 'next/server';

// In-memory nonce store with 5-minute TTL
const nonces = new Map<string, { nonce: string; expiresAt: number }>();

// Clean up expired nonces on each request
function pruneExpired() {
  const now = Date.now();
  for (const [addr, entry] of nonces) {
    if (entry.expiresAt < now) {
      nonces.delete(addr);
    }
  }
}

export function GET(request: NextRequest) {
  pruneExpired();

  const address = request.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 });
  }

  const nonce = generateSiweNonce();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  nonces.set(address.toLowerCase(), { nonce, expiresAt });

  return NextResponse.json({ nonce });
}

export { nonces };
