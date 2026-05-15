'use client';

import { createClient, espaceTestnet, http } from '@cfxdevkit/core';
import type { EspaceClient } from '@cfxdevkit/core/client';
import {
  createSwappiAdapter,
  createTokenRegistry,
  PortfolioTable,
  SwapWidget,
  TokenPicker,
} from '@cfxdevkit/defi-react';
import { CodeSnippet, DemoCard, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { CfxProvider } from '@cfxdevkit/react';
import { useMemo, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { SiteLayout } from '../site-layout';

const ESPACE_TESTNET_CHAIN_ID = 71;

// eSpace testnet client for read-only calls and the Swappi adapter.
const espaceClient = createClient({ chain: espaceTestnet, transport: http() });

// Known testnet token addresses on Conflux eSpace testnet (chainId 71).
const STATIC_TOKENS = [
  {
    address: '0x2Ed3dddae5B2F321AF0806181FBFA6D049Be47d8' as `0x${string}`,
    symbol: 'WCFX',
    name: 'Wrapped CFX',
    decimals: 18,
    chainId: ESPACE_TESTNET_CHAIN_ID,
  },
  {
    address: '0x349298b0e20df67defd6efb8f3170cf4a32722ef' as `0x${string}`,
    symbol: 'cUSDT',
    name: 'Tether USD (Conflux)',
    decimals: 18,
    chainId: ESPACE_TESTNET_CHAIN_ID,
  },
];

const TOKEN_REGISTRY = createTokenRegistry(STATIC_TOKENS);

const PORTFOLIO_SNIPPET = `import { PortfolioTable, createTokenRegistry } from '@cfxdevkit/defi-react';

const tokens = [
  { address: '0x2Ed3…', symbol: 'WCFX', name: 'Wrapped CFX', decimals: 18, chainId: 71 },
  { address: '0x349…',  symbol: 'cUSDT', name: 'Tether USD', decimals: 18, chainId: 71 },
];

function Portfolio({ address }) {
  return <PortfolioTable tokens={tokens} address={address} />;
}`;

const SWAP_SNIPPET = `import { SwapWidget, createSwappiAdapter } from '@cfxdevkit/defi-react';
import { createClient, http, espaceTestnet } from '@cfxdevkit/core';
import { CfxProvider } from '@cfxdevkit/react';

const client = createClient({ chain: espaceTestnet, transport: http() });
const adapter = createSwappiAdapter({ chainId: 71, client });

function Swap({ signer }) {
  return (
    <CfxProvider client={client} signer={signer}>
      <SwapWidget
        adapter={adapter}
        tokens={tokens}
        defaultTokenIn={WCFX_ADDRESS}
        defaultTokenOut={CUSDT_ADDRESS}
      />
    </CfxProvider>
  );
}`;

// Signer bridge: wraps a wagmi WalletClient as a CfxProvider Signer so
// SwapWidget can submit transactions through the connected eSpace wallet.
function DefiProviderBridge({ children }: { children: React.ReactNode }) {
  const { data: walletClient } = useWalletClient();

  const signer = useMemo(() => {
    if (!walletClient) return null;
    return {
      address: walletClient.account.address,
      signMessage: (message: string) => walletClient.signMessage({ message }),
      signTransaction: async (tx: unknown) => {
        const t = tx as {
          to: `0x${string}`;
          data?: `0x${string}`;
          value?: bigint;
          gas: `0x${string}`;
          nonce: `0x${string}`;
          gasPrice: `0x${string}`;
          chainId: number;
        };
        return walletClient.signTransaction({
          to: t.to,
          data: t.data,
          value: t.value ?? 0n,
          gas: BigInt(t.gas),
          nonce: Number(BigInt(t.nonce)),
          gasPrice: BigInt(t.gasPrice),
          chainId: t.chainId,
          account: walletClient.account,
          type: 'legacy' as const,
        });
      },
    };
  }, [walletClient]);

  return (
    <CfxProvider client={espaceClient} signer={signer}>
      {children}
    </CfxProvider>
  );
}

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function DefiPage() {
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState<(typeof STATIC_TOKENS)[number] | null>(null);

  const swappiAdapter = useMemo(
    () =>
      createSwappiAdapter({
        chainId: ESPACE_TESTNET_CHAIN_ID,
        client: espaceClient as EspaceClient,
      }),
    [],
  );

  return (
    <SiteLayout>
      <DefiProviderBridge>
        {/* Token Picker */}
        <DemoCard
          title="Token Picker"
          description="TokenPicker — headless token search UI, data-driven via createTokenRegistry."
        >
          <TokenPicker
            registry={TOKEN_REGISTRY}
            chainId={ESPACE_TESTNET_CHAIN_ID}
            {...(selectedToken ? { selected: selectedToken.address } : {})}
            onSelect={(t) => setSelectedToken(t as (typeof STATIC_TOKENS)[number])}
          />
          {selectedToken && (
            <div
              style={{
                marginTop: 'var(--cfx-space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--cfx-space-2)',
              }}
            >
              <StatusBadge
                status="ok"
                label={`Selected: ${selectedToken.symbol} (${selectedToken.name})`}
              />
            </div>
          )}
        </DemoCard>

        {/* Portfolio */}
        <DemoCard
          title="Portfolio"
          description="PortfolioTable + usePortfolio — live token balances for the connected wallet."
        >
          {isConnected ? (
            <PortfolioTable tokens={STATIC_TOKENS} address={address ?? null} />
          ) : (
            <StatusBadge status="pending" label="Connect an eSpace wallet to see token balances" />
          )}
          <div style={{ marginTop: 'var(--cfx-space-3)' }}>
            <CodeSnippet code={PORTFOLIO_SNIPPET} label="Usage" />
          </div>
        </DemoCard>

        {/* Swap Widget */}
        <DemoCard
          title="Swap (Swappi V2)"
          description="SwapWidget backed by createSwappiAdapter — live quotes via Swappi V2 on eSpace testnet."
        >
          <SwapWidget
            adapter={swappiAdapter}
            tokens={STATIC_TOKENS}
            {...(STATIC_TOKENS[0] ? { defaultTokenIn: STATIC_TOKENS[0].address } : {})}
            {...(STATIC_TOKENS[1] ? { defaultTokenOut: STATIC_TOKENS[1].address } : {})}
            onSwapSubmitted={(tx) => console.info('Swap submitted:', tx.hash)}
          />
          <div style={{ marginTop: 'var(--cfx-space-3)' }}>
            <CodeSnippet code={SWAP_SNIPPET} label="Usage" />
          </div>
        </DemoCard>
      </DefiProviderBridge>
    </SiteLayout>
  );
}
