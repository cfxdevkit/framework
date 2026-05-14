'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { readTargetEspaceChain } from '../lib/ethereum';

const TARGET_CHAIN = readTargetEspaceChain();

export const EXPECTED_CHAIN_ID = TARGET_CHAIN.chainId;
export const EXPECTED_CHAIN_NAME = TARGET_CHAIN.name;

export function useNetworkSwitch() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [switchError, setSwitchError] = useState<string | null>(null);

  const isWrongNetwork = isConnected && chainId !== EXPECTED_CHAIN_ID;

  useEffect(() => {
    if (!isWrongNetwork) setSwitchError(null);
  }, [isWrongNetwork]);

  const handleSwitchNetwork = useCallback(async () => {
    setSwitchError(null);
    try {
      switchChain({ chainId: EXPECTED_CHAIN_ID });
    } catch {
      const provider = (
        window as Window & {
          ethereum?: { request: (a: unknown) => Promise<unknown> };
        }
      ).ethereum;
      if (!provider) {
        setSwitchError('No wallet found — add the network manually in MetaMask.');
        return;
      }
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: TARGET_CHAIN.chainIdHex,
              chainName: TARGET_CHAIN.name,
              nativeCurrency: { name: 'CFX', symbol: 'CFX', decimals: 18 },
              rpcUrls: [TARGET_CHAIN.rpcUrl],
              ...(TARGET_CHAIN.explorerUrl
                ? { blockExplorerUrls: [TARGET_CHAIN.explorerUrl] }
                : {}),
            },
          ],
        });
      } catch (addErr: unknown) {
        const msg = addErr instanceof Error ? addErr.message : String(addErr);
        if (!msg.toLowerCase().includes('user rejected')) {
          setSwitchError(`Could not switch: ${msg}`);
        }
      }
    }
  }, [switchChain]);

  return { isWrongNetwork, isSwitching, switchError, handleSwitchNetwork };
}
