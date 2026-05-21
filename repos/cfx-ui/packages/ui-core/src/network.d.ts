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
export declare function useNetworkSwitchController(
  options: UseNetworkSwitchControllerOptions,
): NetworkSwitchController;
//# sourceMappingURL=network.d.ts.map
