/**
 * WagmiProviders — wires up wagmi + react-query for the showcase.
 *
 * This is the "external EVM wallet" connector path: it uses
 * `wagmi/connectors`'s `injected()` to talk to whatever EIP-1193 provider
 * the user has installed, except Fluent (MetaMask, OKX, Brave, Frame…).
 *
 * Conflux **eSpace** chains only — wagmi assumes Ethereum-flavoured RPC
 * (`eth_*`). For Conflux **Core space** (`cfx_*` RPC, base32 addresses,
 * Fluent's `window.conflux` provider) see the dedicated panels that use
 * the direct Core connector.
 *
 * Chain set:
 *   - eSpace mainnet (1030)  — https://evm.confluxrpc.com
 *   - eSpace testnet (71)    — https://evmtestnet.confluxrpc.com
 *
 * No local devnode here — the local xcfx node has no CORS preflight, so
 * browsers can't reach it without a backend proxy.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';
import { defineChain, type EIP1193Provider } from 'viem';
import {
  createConfig,
  createStorage,
  http,
  noopStorage,
  useAccount,
  useDisconnect,
  WagmiProvider,
} from 'wagmi';
import { injected } from 'wagmi/connectors';

export const espaceMainnet = defineChain({
  id: 1030,
  name: 'Conflux eSpace',
  nativeCurrency: { name: 'CFX', symbol: 'CFX', decimals: 18 },
  rpcUrls: { default: { http: ['https://evm.confluxrpc.com'] } },
  blockExplorers: {
    default: { name: 'ConfluxScan', url: 'https://evm.confluxscan.org' },
  },
});

export const espaceTestnet = defineChain({
  id: 71,
  name: 'Conflux eSpace (Testnet)',
  nativeCurrency: { name: 'CFX', symbol: 'CFX', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmtestnet.confluxrpc.com'] } },
  blockExplorers: {
    default: { name: 'ConfluxScan', url: 'https://evmtestnet.confluxscan.org' },
  },
  testnet: true,
});

export const SUPPORTED_ESPACE_CHAINS = [espaceMainnet, espaceTestnet] as const;

/**
 * Generic EIP-1193 provider target — never returns Fluent.
 *
 * Fluent can expose both window.fluent and a window.ethereum entry. If wagmi
 * connects to either, later eSpace chain checks can route to Fluent and trigger
 * repeated wallet_switchEthereumChain prompts while the user is only switching
 * Core. We keep Fluent out of wagmi completely; Core uses window.conflux.
 */
function nonFluentEthereumTarget():
  | undefined
  | { id: string; name: string; provider: EIP1193Provider } {
  if (typeof window === 'undefined') return undefined;
  const win = window as unknown as Record<string, unknown>;
  const eth = win.ethereum as (EIP1193Provider & { providers?: EIP1193Provider[] }) | undefined;
  const candidates = eth?.providers?.length ? eth.providers : eth ? [eth] : [];
  const provider = candidates.find((candidate) => !(candidate as { isFluent?: boolean }).isFluent);
  if (!provider) return undefined;
  return { id: 'injected', name: 'Browser Wallet', provider };
}

const wagmiConfig = createConfig({
  chains: [espaceMainnet, espaceTestnet],
  multiInjectedProviderDiscovery: false,
  connectors: [
    // Covers MetaMask, OKX, Brave, Rabby, and other non-Fluent injected wallets.
    // Fluent is intentionally excluded from wagmi; Core uses window.conflux.
    injected({ shimDisconnect: true, target: nonFluentEthereumTarget }),
  ],
  // noopStorage prevents wagmi from persisting chainId across sessions.
  // Without this, wagmi's reconnect-on-mount reads the stored chainId and fires
  // wallet_switchEthereumChain automatically — even when the user did not ask
  // to switch. Chain selection is now always explicit via the pill buttons.
  storage: createStorage({ storage: noopStorage }),
  transports: {
    [espaceMainnet.id]: http(),
    [espaceTestnet.id]: http(),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0, staleTime: 8_000, refetchOnWindowFocus: false },
  },
});

function isFluentProvider(provider: unknown): boolean {
  if (typeof window === 'undefined' || typeof provider !== 'object' || provider === null) {
    return false;
  }
  const win = window as unknown as Record<string, unknown>;
  return provider === win.fluent || Boolean((provider as { isFluent?: boolean }).isFluent);
}

function RejectFluentWagmiConnector() {
  const { connector } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    let cancelled = false;
    if (!connector) return;

    connector
      .getProvider()
      .then((provider) => {
        if (!cancelled && isFluentProvider(provider)) disconnect();
      })
      .catch(() => {
        // ignore provider lookup failures; wagmi will surface real connector errors
      });

    return () => {
      cancelled = true;
    };
  }, [connector, disconnect]);

  return null;
}

export function WagmiProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RejectFluentWagmiConnector />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
