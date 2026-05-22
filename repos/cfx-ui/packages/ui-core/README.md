# @cfxdevkit/ui-core

Headless wallet, network, and token-selection controllers for reusable Conflux UI.

## Responsibilities

- Own reusable web3 UI state and controller logic with no styling assets.
- Depend only on lower-level framework packages and generic peers such as React and wagmi.
- Stay safe to consume from Tailwind packages, app-level wrappers, or product-specific shells.

## Current surfaces

- `useWalletSession`
- `useNetworkSwitchController`
- `normalizeAddress`
- `wcfxAddress`
- `resolveTokenAddress`
- `resolveDisplayTokenAddress`
- `getPairedTokens`
- `useSelectableTokens`

## Usage

```tsx
import { useNetworkSwitchController, useWalletSession } from '@cfxdevkit/ui-core';

export function WalletGate({ expectedChainId }: { expectedChainId: number }) {
  const wallet = useWalletSession();
  const network = useNetworkSwitchController({ expectedChainId });

  if (!wallet.isConnected) {
    return <button onClick={wallet.connect}>Connect wallet</button>;
  }

  if (network.isWrongNetwork) {
    return <button onClick={() => void network.switchNetwork()}>Switch network</button>;
  }

  return <span>{wallet.address}</span>;
}
```

## Rules

- Do not add CSS imports, inline style objects, or product-specific visual tokens here.
- Do not import app packages such as CAS or showcase packages.
- Add tests for every new controller or helper before expanding consumers.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 28 symbols |
| `./network` | 4 symbols |
| `./tokens` | 19 symbols |
| `./wallet` | 4 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/ui-core";
export declare const CFX_NATIVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export declare const WCFX_ADDRESSES: {
  mainnet: string;
  testnet: string;
};
export declare const DEFAULT_MAINNET_TOKENS: readonly {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}[];
export declare const DEFAULT_MAINNET_ERC20_TOKENS: readonly {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}[];
export declare const DEFAULT_MAINNET_PAIRS: readonly {
  token0: string;
  token1: string;
  fee?: number;
}[];
export declare const DEFAULT_MAINNET_DISPLAY_TOKENS: readonly {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}[];
export declare const DEFAULT_MAINNET_DISPLAY_ERC20_TOKENS: readonly {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}[];
export interface AddEthereumChainParameter {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: readonly string[];
  blockExplorerUrls?: readonly string[];
  iconUrls?: readonly string[];
}
export interface UseNetworkSwitchControllerOptions {
  expectedChainId: number;
}
export interface NetworkSwitchController {
  isConnected: boolean;
  isWrongNetwork: boolean;
  switchNetwork: () => Promise<void>;
}
export interface PairLike {
  token0: string;
  token1: string;
  fee?: number;
}
export interface SelectableTokenLike {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}
export interface TokenMetadata extends SelectableTokenLike {
  isNative: boolean;
  isWrappedNative: boolean;
}
export interface TokenSelectionOptions {
  includeNative?: boolean;
  includeWrappedNative?: boolean;
}
export interface UseSelectableTokensOptions<TToken extends SelectableTokenLike> {
  tokens: readonly TToken[];
  options?: TokenSelectionOptions;
}
export interface UseWalletSessionOptions {
  autoConnect?: boolean;
}
export interface WalletSessionController {
  status: WalletSessionStatus;
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}
export declare function useNetworkSwitchController(options: UseNetworkSwitchControllerOptions): NetworkSwitchController;
export declare function normalizeAddress(address: string): string;
export declare function wcfxAddress(network?: keyof typeof WCFX_ADDRESSES): string;
export declare function resolveTokenAddress(address: string, wrappedNativeAddress?: string, nativeAddress?: string): string;
export declare function resolveDisplayTokenAddress(address: string, wrappedNativeAddress?: string, nativeAddress?: string): string;
export declare function getDisplayTokens<TToken extends SelectableTokenLike>(tokens: readonly TToken[], options?: TokenSelectionOptions): TToken[];
export declare function getPairedTokens<TToken extends SelectableTokenLike>(pairs: readonly PairLike[], allTokens: readonly TToken[], tokenInAddress: string, options?: TokenSelectionOptions): TToken[];
export declare function useSelectableTokens<TToken extends SelectableTokenLike>(options: UseSelectableTokensOptions<TToken>): TToken[];
export declare function useWalletSession(options?: UseWalletSessionOptions): WalletSessionController;
export type WalletSessionStatus = 'disconnected' | 'connecting' | 'connected';
```

---

## `./network`

```ts
export interface AddEthereumChainParameter {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: readonly string[];
  blockExplorerUrls?: readonly string[];
  iconUrls?: readonly string[];
}
export interface UseNetworkSwitchControllerOptions {
  expectedChainId: number;
}
export interface NetworkSwitchController {
  isConnected: boolean;
  isWrongNetwork: boolean;
  switchNetwork: () => Promise<void>;
}
export declare function useNetworkSwitchController(options: UseNetworkSwitchControllerOptions): NetworkSwitchController;
```

---

## `./tokens`

```ts
export declare const CFX_NATIVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export declare const WCFX_ADDRESSES: {
  mainnet: string;
  testnet: string;
};
export declare const DEFAULT_MAINNET_TOKENS: readonly {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}[];
export declare const DEFAULT_MAINNET_ERC20_TOKENS: readonly {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}[];
export declare const DEFAULT_MAINNET_PAIRS: readonly {
  token0: string;
  token1: string;
  fee?: number;
}[];
export declare const DEFAULT_MAINNET_DISPLAY_TOKENS: readonly {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}[];
export declare const DEFAULT_MAINNET_DISPLAY_ERC20_TOKENS: readonly {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}[];
export interface PairLike {
  token0: string;
  token1: string;
  fee?: number;
}
export interface SelectableTokenLike {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}
export interface TokenMetadata extends SelectableTokenLike {
  isNative: boolean;
  isWrappedNative: boolean;
}
export interface TokenSelectionOptions {
  includeNative?: boolean;
  includeWrappedNative?: boolean;
}
export interface UseSelectableTokensOptions<TToken extends SelectableTokenLike> {
  tokens: readonly TToken[];
  options?: TokenSelectionOptions;
}
export declare function normalizeAddress(address: string): string;
export declare function wcfxAddress(network?: keyof typeof WCFX_ADDRESSES): string;
export declare function resolveTokenAddress(address: string, wrappedNativeAddress?: string, nativeAddress?: string): string;
export declare function resolveDisplayTokenAddress(address: string, wrappedNativeAddress?: string, nativeAddress?: string): string;
```

---

## `./wallet`

```ts
export interface UseWalletSessionOptions {
  autoConnect?: boolean;
}
export interface WalletSessionController {
  status: WalletSessionStatus;
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}
export declare function useWalletSession(options?: UseWalletSessionOptions): WalletSessionController;
export type WalletSessionStatus = 'disconnected' | 'connecting' | 'connected';
```

## Install

```bash
pnpm add @cfxdevkit/ui-core
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 0 — framework** — Must not runtime-import from any higher tier.

<!-- readme-hash: 081a8baff38ff4805b151b6b4cb846d0bc89d5afae9119446733915b5b3193bd -->
