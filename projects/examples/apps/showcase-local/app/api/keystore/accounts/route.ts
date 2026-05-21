import { generateMnemonic } from '@cfxdevkit/cdk';
import { NextResponse } from 'next/server';
import type {
  CreateKeystoreWalletRequest,
  KeystoreWalletMutationResponse,
  KeystoreWalletsResponse,
} from '../../../../lib/keystore-types';
import { noStoreHeaders, readRuntimeJson, requestRuntime } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET() {
  const response = await requestRuntime('/keystore/wallets', { method: 'GET' });
  const body = await readRuntimeJson<KeystoreWalletsResponse>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}

export async function POST(request: Request) {
  const input = await request.json().catch(() => ({}) as CreateKeystoreWalletRequest);
  const name = input.name?.trim() || 'Showcase Wallet';
  const mnemonic = input.mnemonic?.trim() || generateMnemonic(128);
  const response = await requestRuntime('/keystore/wallets', {
    body: JSON.stringify({ mnemonic, name }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  const body = await readRuntimeJson<KeystoreWalletMutationResponse>(response);

  return NextResponse.json(body, {
    headers: noStoreHeaders(),
    status: response.status,
  });
}
