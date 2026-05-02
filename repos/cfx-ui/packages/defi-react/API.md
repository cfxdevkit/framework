# @cfxdevkit/defi-react — Public API

> Opinionated DeFi widgets for prototypes & demos. Built on `react`, `services/dex`,
> `services/tokens`, and `theme`. **No protocol logic here** — this is composition.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/defi-react/swap` | swap widget + `useSwap` hook |
| `@cfxdevkit/defi-react/balance` | portfolio table + hook |
| `@cfxdevkit/defi-react/token-picker` | token selector |
| `@cfxdevkit/defi-react/tx-status` | submitted-tx toast/list |

---

## `defi-react/swap`

```
function useSwap(input: {
  adapter: DexAdapter
  tokenIn: Address
  tokenOut: Address
  amountIn: Wei
  slippageBps?: number          // default 50
  deadlineMs?: DurationMs       // default 60_000
}): {
  quote: Quote | undefined
  isQuoting: boolean
  swapAsync: () => Promise<{ hash: Hash }>
  isSwapping: boolean
  error: DexError | null
}

const SwapWidget: React.FC<{
  adapter: DexAdapter
  tokens?: TokenInfo[]                    // defaults to registry
  defaultTokenIn?: Address
  defaultTokenOut?: Address
  onSwapSubmitted?: (tx: { hash: Hash }) => void
}>
```

---

## `defi-react/balance`

```
function usePortfolio(input: { address?: Address; tokens: TokenInfo[]; refreshMs?: DurationMs }): {
  rows: Array<{ token: TokenInfo; balance: Wei; formatted: string }>
  totalUsd?: number
  isLoading: boolean
}

const PortfolioTable: React.FC<{ tokens: TokenInfo[]; address?: Address; renderRow?: (row: { token; balance; formatted }) => React.ReactNode }>
```

---

## `defi-react/token-picker`

```
const TokenPicker: React.FC<{
  registry: ReturnType<typeof createTokenRegistry>
  chainId: ChainId
  selected?: Address
  onSelect: (token: TokenInfo) => void
}>
```

Headless. Search + filter only.

---

## `defi-react/tx-status`

```
const TxStatusList: React.FC<{ recent?: number }>      // shows in-flight tx from useSendTransaction
const TxStatusToast: React.FC<{ hash: Hash; onConfirm?: (r: TxReceipt) => void }>
```
