# @cfxdevkit/defi-react

**Scope:** React helpers for common DeFi UX patterns (token balance, swap quote, allowance, pool participation, transaction status).

Depends on: `react`, `@cfxdevkit/services`, `@cfxdevkit/cdk`.

## Installation

```bash
npm install @cfxdevkit/defi-react
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 119 symbols |
| `./swap` | 6 symbols |
| `./balance` | 5 symbols |
| `./token-picker` | 2 symbols |
| `./tx-status` | 6 symbols |
| `./primitives` | 73 symbols |
| `./service` | 4 symbols |
| `./pool` | 10 symbols |
| `./lp` | 0 symbols |

---

## `.`

Core DeFi hooks and components for building DeFi interfaces.

### Hooks

```ts
// Portfolio & Pool Data
export declare function usePortfolio(input: UsePortfolioInput): UsePortfolioReturn;
export declare function usePools(input: UsePoolsInput): UsePoolsReturn;
export declare function usePoolTokens(input: UsePoolTokensInput): UsePoolTokensReturn;
export declare function useTokenPrice(input: UseTokenPriceInput): UseTokenPriceReturn;

// Swap
export declare function useSwap(input: UseSwapInput): UseSwapReturn;
```

### Components

#### Layout & UI Primitives
- `Button`, `Card`, `Badge`, `Tabs`, `SectionHeader`, `StatusBanner`, `MetricCard`, `Panel`, `MainGrid`
- `AppNavBar`, `NavBrand`, `NavWalletActions`
- `Input`, `CopyButton`, `SelectableListItem`, `SelectMenu`, `SegmentedControl`

#### DeFi-Specific UI
- `PortfolioTable` — displays token balances and USD values
- `TradeTokenField` — input field for selecting token and entering amount
- `TradeActionBar` — action buttons for swap/approve with state handling
- `TradeSummaryGrid` — displays key trade details (price impact, route, etc.)
- `SwapWidget` — full swap interface (requires `SwapServiceConfig`)
- `TokenPicker` — modal/list picker for selecting tokens
- `FaucetWidget` — token faucet integration
- `DevkitStatus` — displays connection status of the SDK
- `AppToaster` — toast notification container

#### Network & Status
- `NetworkBadge` — shows chain name/logo by `chainId`
- `TxStatusList`, `TxStatusToast` — transaction status tracking

### Types

```ts
export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
  logoURI?: string;
}

export interface Quote {
  amountIn: string;
  amountOut: string;
  priceImpact: string;
  path: string[];
}

export interface SwapCalldata {
  to: string;
  data: string;
  value?: string;
}

export interface BuildSwapCalldataOptions {
  slippageTolerance?: number;
  deadline?: number;
}

export interface DexAdapter {
  name: string;
  swap: (quote: Quote, options: BuildSwapCalldataOptions) => Promise<SwapCalldata>;
}

export interface TokenRegistry {
  getTokenByAddress: (address: string) => TokenInfo | undefined;
  getAllTokens: () => TokenInfo[];
}

export interface SwapServiceConfig {
  rpcUrl: string;
  chainId: number;
  dexAdapters: DexAdapter[];
}
```

> **Note:** All hooks and components assume `@cfxdevkit/cdk` is initialized (e.g., wallet connected, provider available).

<!-- readme-hash: 8bf46925318b9cefa4c043956dfa0f06e99ecd714777896a39e22b850eec04e1 -->
