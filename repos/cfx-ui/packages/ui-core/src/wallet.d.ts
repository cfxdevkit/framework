import type { Connector } from 'wagmi';
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
export declare function useWalletSession(
  options?: UseWalletSessionOptions,
): WalletSessionController;
//# sourceMappingURL=wallet.d.ts.map
