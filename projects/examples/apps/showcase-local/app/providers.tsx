'use client';

import { ConfluxWagmiProviders } from '@cfxdevkit/wallet-connect';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ConfluxWagmiProviders configOptions={{ localRpcUrl: 'http://localhost:8545' }}>
      {mounted ? children : null}
    </ConfluxWagmiProviders>
  );
}
