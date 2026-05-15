import { verifySiweMessage } from '@cfxdevkit/wallet-connect/siwe';
import { type NextRequest, NextResponse } from 'next/server';
import { nonces } from '../nonce/route';

export async function POST(request: NextRequest) {
  let body: { message?: string; signature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { message, signature } = body;
  if (!message || !signature) {
    return NextResponse.json({ error: 'Missing message or signature' }, { status: 400 });
  }

  // Extract address from message for nonce lookup
  const addressMatch = message.match(/^(0x[0-9a-fA-F]{40})\s/m);
  const address = addressMatch?.[1]?.toLowerCase();
  const stored = address ? nonces.get(address) : undefined;

  if (!stored || stored.expiresAt < Date.now()) {
    return NextResponse.json({ error: 'Nonce not found or expired' }, { status: 401 });
  }

  const result = await verifySiweMessage({
    message,
    signature: signature as `0x${string}`,
    expectedNonce: stored.nonce,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Verification failed' }, { status: 401 });
  }

  // Consume nonce (one-time use)
  if (address) {
    nonces.delete(address);
  }

  // Return a simple payload — in a real app you'd sign a JWT here
  const payload = {
    address: result.address,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  return NextResponse.json({ ok: true, payload });
}
