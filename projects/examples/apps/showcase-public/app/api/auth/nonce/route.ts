import { generateSiweNonce } from '@cfxdevkit/wallet-connect/siwe';
import { type NextRequest, NextResponse } from 'next/server';

import { nonces, pruneExpired } from '../nonce-store';

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
