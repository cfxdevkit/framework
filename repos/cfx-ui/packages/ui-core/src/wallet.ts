import { useCallback, useEffect, useRef } from 'react';
import type { Connector } from 'wagmi';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export type WalletSessionStatus = 'disconnected' | 'connecting' | 'connected';

export interface UseWalletSessionOptions {
  connector?: Connector;
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export interface WalletSessionController {
  address: string | null;
  chainId: number | null;
  connectors: readonly Connector[];
  error: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  status: WalletSessionStatus;
  connect: () => void;
  disconnect: () => void;
}

export function useWalletSession(options: UseWalletSessionOptions = {}): WalletSessionController {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const previousAddressRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      if (previousAddressRef.current) {
        previousAddressRef.current = null;
        options.onDisconnect?.();
      }
      return;
    }

    if (previousAddressRef.current !== address) {
      previousAddressRef.current = address;
      options.onConnect?.(address);
    }
  }, [address, isConnected, options]);

  const connectWallet = useCallback(() => {
    const connector = options.connector ?? connectors[0];
    if (!connector) return;
    connect({ connector });
  }, [connect, connectors, options.connector]);

  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return {
    address: address ?? null,
    chainId: chainId ?? null,
    connectors,
    error: error?.message ?? null,
    isConnected,
    isConnecting: isPending,
    status: isConnected ? 'connected' : isPending ? 'connecting' : 'disconnected',
    connect: connectWallet,
    disconnect: disconnectWallet,
  };
}
