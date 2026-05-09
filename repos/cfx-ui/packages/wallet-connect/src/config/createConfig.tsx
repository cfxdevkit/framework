import { QueryClient, type QueryClientConfig, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import type { EIP1193Provider } from 'viem';
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
import { type CreateSupportedEspaceChainsOptions, createSupportedEspaceChains } from './chains.js';

export interface CreateConfluxWagmiConfigOptions extends CreateSupportedEspaceChainsOptions {
  multiInjectedProviderDiscovery?: boolean;
  shimDisconnect?: boolean;
}

export interface ConfluxWagmiProvidersProps {
  children: ReactNode;
  config?: ReturnType<typeof createConfluxWagmiConfig>;
  configOptions?: CreateConfluxWagmiConfigOptions;
  queryClient?: QueryClient;
  queryClientConfig?: QueryClientConfig;
}

export function nonFluentEthereumTarget():
  | undefined
  | { id: string; name: string; provider: EIP1193Provider } {
  if (typeof window === 'undefined') return undefined;
  const candidate = window as Window & {
    ethereum?: EIP1193Provider & { providers?: EIP1193Provider[] };
  };
  const injectedProvider = candidate.ethereum;
  const candidates = injectedProvider?.providers?.length
    ? injectedProvider.providers
    : injectedProvider
      ? [injectedProvider]
      : [];
  const provider = candidates.find((entry: EIP1193Provider) => !isFluentProvider(entry));
  if (!provider) return undefined;
  return { id: 'injected', name: 'Browser Wallet', provider };
}

export function isFluentProvider(provider: unknown): boolean {
  if (typeof window === 'undefined' || typeof provider !== 'object' || provider === null) {
    return false;
  }
  const candidate = window as Window & { fluent?: unknown };
  return provider === candidate.fluent || Boolean((provider as { isFluent?: boolean }).isFluent);
}

export function createConfluxWagmiConfig(options: CreateConfluxWagmiConfigOptions = {}) {
  const chains = createSupportedEspaceChains(options);
  const transports = Object.fromEntries(chains.map((chain) => [chain.id, http()])) as Record<
    number,
    ReturnType<typeof http>
  >;

  return createConfig({
    chains,
    multiInjectedProviderDiscovery: options.multiInjectedProviderDiscovery ?? false,
    connectors: [
      injected({
        shimDisconnect: options.shimDisconnect ?? true,
        target: nonFluentEthereumTarget,
      }),
    ],
    storage: createStorage({ storage: noopStorage }),
    transports,
  });
}

export function createConfluxQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        staleTime: 8_000,
        refetchOnWindowFocus: false,
      },
      ...config?.defaultOptions,
    },
    ...config,
  });
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
        if (!cancelled && isFluentProvider(provider)) {
          disconnect();
        }
      })
      .catch(() => {
        // Ignore provider lookup errors. Wagmi will surface real connector failures.
      });

    return () => {
      cancelled = true;
    };
  }, [connector, disconnect]);

  return null;
}

export function ConfluxWagmiProviders({
  children,
  config,
  configOptions,
  queryClient,
  queryClientConfig,
}: ConfluxWagmiProvidersProps) {
  const [wagmiConfig] = useState(() => config ?? createConfluxWagmiConfig(configOptions));
  const [client] = useState(() => queryClient ?? createConfluxQueryClient(queryClientConfig));

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={client}>
        <RejectFluentWagmiConnector />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
