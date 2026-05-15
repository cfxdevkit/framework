'use client';

import { createClient, espaceTestnet, http } from '@cfxdevkit/core';
import { CfxProvider } from '@cfxdevkit/react';
import { ThemeProvider } from '@cfxdevkit/theme/react';
import { ConfluxWagmiProviders } from '@cfxdevkit/wallet-connect';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

// Default read-only client pointing at eSpace testnet — used by DeFi hooks.
const cfxClient = createClient({ chain: espaceTestnet, transport: http() });

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider defaultTheme="dark">
      {/* multiInjectedProviderDiscovery enables EIP-6963 so MetaMask is reliably
          discovered even when Fluent is the primary window.ethereum provider. */}
      <ConfluxWagmiProviders configOptions={{ multiInjectedProviderDiscovery: true }}>
        {/* CfxProvider gives @cfxdevkit/react hooks (useNativeBalance, useContract…)
            a read-only eSpace testnet client without requiring a wallet. */}
        <CfxProvider client={cfxClient}>{mounted ? children : null}</CfxProvider>
      </ConfluxWagmiProviders>
    </ThemeProvider>
  );
}
