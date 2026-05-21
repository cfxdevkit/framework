'use client';

import { createClient, espaceMainnet, http } from '@cfxdevkit/cdk';
import type { EspaceClient } from '@cfxdevkit/cdk/client';
import {
  createSwappiAdapter,
  createTokenRegistry,
  PortfolioTable,
  SwapWidget,
  TokenPicker,
} from '@cfxdevkit/defi-react';
import { CodeSnippet, DemoCard, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { CfxProvider } from '@cfxdevkit/react';
import {
  CFX_NATIVE_ADDRESS,
  DEFAULT_MAINNET_DISPLAY_TOKENS,
  DEFAULT_MAINNET_ERC20_TOKENS,
  DEFAULT_MAINNET_PAIRS,
  getPairedTokens,
  wcfxAddress,
} from '@cfxdevkit/ui-core';
import { useMemo, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { SiteLayout } from '../site-layout';

const ESPACE_MAINNET_CHAIN_ID = 1030;

// eSpace mainnet client for read-only calls and the Swappi adapter.
const espaceClient = createClient({ chain: espaceMainnet, transport: http() });

const TOKEN_REGISTRY = createTokenRegistry(DEFAULT_MAINNET_DISPLAY_TOKENS);
const DEFAULT_SWAP_TOKEN_IN = DEFAULT_MAINNET_DISPLAY_TOKENS[0];
const DEFAULT_SWAP_OUTPUT_OPTIONS = getPairedTokens(
  DEFAULT_MAINNET_PAIRS,
  DEFAULT_MAINNET_DISPLAY_TOKENS,
  DEFAULT_SWAP_TOKEN_IN?.address ?? CFX_NATIVE_ADDRESS,
  { wrappedNativeAddress: wcfxAddress('mainnet') },
);
const DEFAULT_SWAP_TOKEN_OUT = DEFAULT_SWAP_OUTPUT_OPTIONS[0] ?? DEFAULT_MAINNET_DISPLAY_TOKENS[1];

const PORTFOLIO_SNIPPET = `import { PortfolioTable } from '@cfxdevkit/defi-react';
import { DEFAULT_MAINNET_ERC20_TOKENS } from '@cfxdevkit/ui-core';

function Portfolio({ address }) {
  return <PortfolioTable tokens={DEFAULT_MAINNET_ERC20_TOKENS} address={address} />;
}`;

const SWAP_SNIPPET = `import { SwapWidget, createSwappiAdapter } from '@cfxdevkit/defi-react';
import { createClient, http, espaceMainnet } from '@cfxdevkit/cdk';
import { CfxProvider } from '@cfxdevkit/react';
import {
  CFX_NATIVE_ADDRESS,
  DEFAULT_MAINNET_DISPLAY_TOKENS,
  DEFAULT_MAINNET_PAIRS,
  getPairedTokens,
  wcfxAddress,
} from '@cfxdevkit/ui-core';

const client = createClient({ chain: espaceMainnet, transport: http() });
const adapter = createSwappiAdapter({ chainId: 1030, client });
const defaultTokenIn = DEFAULT_MAINNET_DISPLAY_TOKENS[0]?.address ?? CFX_NATIVE_ADDRESS;
const defaultTokenOut =
  getPairedTokens(DEFAULT_MAINNET_PAIRS, DEFAULT_MAINNET_DISPLAY_TOKENS, defaultTokenIn, {
    wrappedNativeAddress: wcfxAddress('mainnet'),
  })[0]?.address ?? DEFAULT_MAINNET_DISPLAY_TOKENS[1].address;

function Swap({ signer }) {
  return (
    <CfxProvider client={client} signer={signer}>
      <SwapWidget
        adapter={adapter}
        tokens={DEFAULT_MAINNET_DISPLAY_TOKENS}
        pairs={DEFAULT_MAINNET_PAIRS}
        tokenSelectionOptions={{ wrappedNativeAddress: wcfxAddress('mainnet') }}
        defaultTokenIn={defaultTokenIn}
        defaultTokenOut={defaultTokenOut}
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
  const [selectedToken, setSelectedToken] = useState<
    (typeof DEFAULT_MAINNET_DISPLAY_TOKENS)[number] | null
  >(null);

  const swappiAdapter = useMemo(
    () =>
      createSwappiAdapter({
        chainId: ESPACE_MAINNET_CHAIN_ID,
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
            chainId={ESPACE_MAINNET_CHAIN_ID}
            {...(selectedToken ? { selected: selectedToken.address } : {})}
            onSelect={(t) => setSelectedToken(t as (typeof DEFAULT_MAINNET_DISPLAY_TOKENS)[number])}
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
            <PortfolioTable tokens={DEFAULT_MAINNET_ERC20_TOKENS} address={address ?? null} />
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
          description="SwapWidget backed by createSwappiAdapter — live quotes via Swappi V2 on eSpace mainnet."
        >
          <SwapWidget
            adapter={swappiAdapter}
            tokens={DEFAULT_MAINNET_DISPLAY_TOKENS}
            pairs={DEFAULT_MAINNET_PAIRS}
            tokenSelectionOptions={{ wrappedNativeAddress: wcfxAddress('mainnet') }}
            {...(DEFAULT_SWAP_TOKEN_IN ? { defaultTokenIn: DEFAULT_SWAP_TOKEN_IN.address } : {})}
            {...(DEFAULT_SWAP_TOKEN_OUT ? { defaultTokenOut: DEFAULT_SWAP_TOKEN_OUT.address } : {})}
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
