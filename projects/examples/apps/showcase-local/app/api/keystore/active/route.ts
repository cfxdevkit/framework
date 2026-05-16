import { NextResponse } from 'next/server';
import type { KeystoreActiveWalletResponse } from '../../../../lib/keystore-types';
import { noStoreHeaders, readRuntimeActiveWallet } from '../../../../lib/local-runtime';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const wallet = (await readRuntimeActiveWallet()) as KeystoreActiveWalletResponse['wallet'];
    return NextResponse.json(
      { ok: true, wallet },
      {
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error), ok: false, wallet: null },
      {
        headers: noStoreHeaders(),
        status: 403,
      },
    );
  }
}
