'use client';

import { ConfluxWagmiProviders } from '@cfxdevkit/wallet-connect/config';
import type { ReactNode } from 'react';
import { AuthProvider } from './auth-context';
import { PoolsProvider } from './pools-context';

export function Providers({ children }: { children: ReactNode }) {
  const localRpcUrl = process.env.NEXT_PUBLIC_CONFLUX_ESPACE_RPC;
  return (
    <ConfluxWagmiProviders {...(localRpcUrl ? { configOptions: { localRpcUrl } } : {})}>
      <AuthProvider>
        <PoolsProvider>{children}</PoolsProvider>
      </AuthProvider>
    </ConfluxWagmiProviders>
  );
}
