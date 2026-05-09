import type { ChainConfig } from '@cfxdevkit/core/chains';
import type { Client } from '@cfxdevkit/core/client';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useMemo } from 'react';

export interface Signer {
  address: `0x${string}`;
  signMessage(message: string): Promise<`0x${string}`>;
  signTransaction(tx: unknown): Promise<`0x${string}`>;
}

interface CfxContextValue {
  client: Client;
  signer: Signer | null;
}

const CfxContext = createContext<CfxContextValue | null>(null);
CfxContext.displayName = 'CfxContext';

export interface CfxProviderProps {
  client: Client;
  signer?: Signer | null;
  queryClient?: QueryClient;
  children: ReactNode;
}

/**
 * Distributes a pre-built `Client` (and optional `Signer`) to all child hooks.
 * The provider does NOT create the client — the app owns construction.
 * This makes SSR and tests trivial: pass a mock client, get predictable behaviour.
 */
export function CfxProvider({ client, signer = null, queryClient, children }: CfxProviderProps) {
  const value = useMemo(() => ({ client, signer }), [client, signer]);

  const inner = <CfxContext.Provider value={value}>{children}</CfxContext.Provider>;

  return queryClient ? (
    <QueryClientProvider client={queryClient}>{inner}</QueryClientProvider>
  ) : (
    inner
  );
}

/**
 * Returns the `Client` instance provided by the nearest `CfxProvider`.
 * Throws if called outside of a provider — do not swallow the error.
 */
export function useClient(): Client {
  const ctx = useContext(CfxContext);
  if (!ctx) {
    throw new Error(
      '`useClient` must be used inside a `<CfxProvider>`. ' +
        'Wrap your component tree with `<CfxProvider client={...}>`.',
    );
  }
  return ctx.client;
}

/**
 * Returns the static chain configuration for the active client.
 */
export function useChain(): ChainConfig {
  return useClient().chain;
}

/**
 * Returns the `Signer` if one was provided to `<CfxProvider>`, otherwise `null`.
 * A `null` signer means the session is read-only.
 */
export function useSigner(): Signer | null {
  const ctx = useContext(CfxContext);
  if (!ctx) {
    throw new Error(
      '`useSigner` must be used inside a `<CfxProvider>`. ' +
        'Wrap your component tree with `<CfxProvider client={...}>`.',
    );
  }
  return ctx.signer;
}
