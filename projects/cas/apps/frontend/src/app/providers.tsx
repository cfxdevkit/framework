'use client';

import { ConfluxWagmiProviders } from '@cfxdevkit/wallet-connect';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { AuthProvider } from './auth-context';
import { PoolsProvider } from './pools-context';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const localRpcUrl = process.env.NEXT_PUBLIC_CONFLUX_ESPACE_RPC;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ConfluxWagmiProviders configOptions={localRpcUrl ? { localRpcUrl } : {}}>
      {mounted ? (
        <AuthProvider>
          <PoolsProvider>{children}</PoolsProvider>
        </AuthProvider>
      ) : null}
    </ConfluxWagmiProviders>
  );
}
