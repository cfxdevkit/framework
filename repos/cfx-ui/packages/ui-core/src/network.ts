import { useCallback, useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';

export interface AddEthereumChainParameter {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

export interface UseNetworkSwitchControllerOptions {
  addChainParams?: AddEthereumChainParameter | undefined;
  expectedChainId: number;
}

export interface NetworkSwitchController {
  chainId: number | null;
  error: string | null;
  isConnected: boolean;
  isSwitching: boolean;
  isWrongNetwork: boolean;
  switchNetwork: () => Promise<void>;
}

export function useNetworkSwitchController(
  options: UseNetworkSwitchControllerOptions,
): NetworkSwitchController {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);

  const isWrongNetwork = isConnected && chainId !== options.expectedChainId;

  useEffect(() => {
    if (!isWrongNetwork) {
      setError(null);
    }
  }, [isWrongNetwork]);

  const switchNetwork = useCallback(async () => {
    setError(null);
    try {
      await switchChainAsync({ chainId: options.expectedChainId });
    } catch {
      if (!options.addChainParams) {
        setError('Could not switch the connected wallet to the expected network.');
        return;
      }

      const provider = (
        window as Window & {
          ethereum?: { request: (input: unknown) => Promise<unknown> };
        }
      ).ethereum;

      if (!provider) {
        setError('No browser wallet provider found for manual network switching.');
        return;
      }

      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [options.addChainParams],
        });
      } catch (addError) {
        const message = addError instanceof Error ? addError.message : String(addError);
        if (!message.toLowerCase().includes('user rejected')) {
          setError(`Could not switch network: ${message}`);
        }
      }
    }
  }, [options.addChainParams, options.expectedChainId, switchChainAsync]);

  return {
    chainId: chainId ?? null,
    error,
    isConnected,
    isSwitching: isPending,
    isWrongNetwork,
    switchNetwork,
  };
}
