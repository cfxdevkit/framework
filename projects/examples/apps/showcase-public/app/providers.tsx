'use client';

import { createClient, espaceMainnet, http } from '@cfxdevkit/cdk';
import { CfxProvider } from '@cfxdevkit/react';
import { ThemeProvider } from '@cfxdevkit/theme/react';
import { ConfluxWagmiProviders } from '@cfxdevkit/wallet-connect';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { WalletSessionProvider } from './wallet-session-context';

// Default read-only client pointing at eSpace mainnet so shared demos resolve
// live balances and token metadata against the production network.
const cfxClient = createClient({ chain: espaceMainnet, transport: http() });

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider defaultTheme="dark">
      <WalletSessionProvider>
        {/* multiInjectedProviderDiscovery enables EIP-6963 so MetaMask is reliably
            discovered even when Fluent is the primary window.ethereum provider. */}
        <ConfluxWagmiProviders configOptions={{ multiInjectedProviderDiscovery: true }}>
          {/* CfxProvider gives @cfxdevkit/react hooks (useNativeBalance, useContract…)
              a read-only eSpace testnet client without requiring a wallet. */}
          <CfxProvider client={cfxClient}>{mounted ? children : null}</CfxProvider>
        </ConfluxWagmiProviders>
      </WalletSessionProvider>
    </ThemeProvider>
  );
}
