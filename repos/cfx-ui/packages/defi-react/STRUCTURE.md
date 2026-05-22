# @cfxdevkit/defi-react — Directory Structure

## Root Files
- `.gitignore` — Git ignore rules  
- `API.md` — API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file: directory layout documentation  
- `moon.yml` — Moon configuration for monorepo tooling  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript configuration  
- `vite.config.ts` — Vite build configuration  
- `vitest.config.ts` — Vitest test configuration  

## `src/`
- `balance/` — Portfolio and balance-related components & hooks  
  - `PortfolioTable.tsx` — Portfolio display table component  
  - `index.ts` — Export barrel for balance module  
  - `usePortfolio.ts` — Portfolio data hook  
- `index.test.ts` — Root-level unit tests  
- `index.ts` — Main entry point  
- `lp/` — Liquidity provision UI and logic  
  - `AddLiquidityWidget.tsx` — Liquidity adding UI widget  
  - `index.ts` — Export barrel for lp module  
- `pool/` — Pool data fetching and management  
  - `index.ts` — Export barrel for pool module  
  - `usePoolTokens.ts` — Hook to fetch pool token data  
  - `usePools.ts` — Hook to fetch pool list  
  - `useTokenPrice.ts` — Hook to fetch token price from pool  
- `primitives/` — Reusable UI primitives  
  - `core.tsx` — Core primitive components (e.g., Button, Input)  
  - `devkit.tsx` — Developer tooling primitives  
  - `feedback.tsx` — Feedback components (toasts, alerts)  
  - `form.tsx` — Form-related primitives  
  - `index.ts` — Export barrel for primitives  
  - `layout.tsx` — Layout primitives (Grid, Stack, etc.)  
  - `navbar-wallet.tsx` — Wallet-connected navbar component  
  - `navbar.tsx` — Base navbar component  
  - `shell.tsx` — App shell wrapper  
  - `trade.tsx` — Trading UI primitives  
  - `widgets.tsx` — Reusable widget primitives  
- `service/` — Business logic services  
  - `SwapService.ts` — Swap business logic service  
  - `index.ts` — Export barrel for service module  
- `swap/` — Swap UI and logic  
  - `SwapWidget.styles.ts` — Swap widget styling  
  - `SwapWidget.tsx` — Main swap UI widget  
  - `SwapWidget.utils.ts` — Swap utility functions  
  - `createSwappiAdapter.ts` — Swappi adapter factory  
  - `index.ts` — Export barrel for swap module  
  - `useSwap.ts` — Swap state and action hook  
- `token-picker/` — Token selection UI  
  - `TokenPicker.tsx` — Token selection dropdown  
  - `index.ts` — Export barrel for token-picker module  
- `tx-status/` — Transaction status UI  
  - `TxStatusList.tsx` — Transaction status list component  
  - `TxStatusToast.tsx` — Transaction status toast  
  - `index.ts` — Export barrel for tx-status module  
- `types.ts` — Shared TypeScript types  

Directory tree:
```
.gitignore
API.md
README.md
STRUCTURE.md
moon.yml
package.json
src
  balance
    PortfolioTable.tsx
    index.ts
    usePortfolio.ts
  index.test.ts
  index.ts
  lp
    AddLiquidityWidget.tsx
    index.ts
  pool
    index.ts
    usePoolTokens.ts
    usePools.ts
    useTokenPrice.ts
  primitives
    core.tsx
    devkit.tsx
    feedback.tsx
    form.tsx
    index.ts
    layout.tsx
    navbar-wallet.tsx
    navbar.tsx
    shell.tsx
    trade.tsx
    widgets.tsx
  service
    SwapService.ts
    index.ts
  swap
    SwapWidget.styles.ts
    SwapWidget.tsx
    SwapWidget.utils.ts
    createSwappiAdapter.ts
    index.ts
    useSwap.ts
  token-picker
    TokenPicker.tsx
    index.ts
  tx-status
    TxStatusList.tsx
    TxStatusToast.tsx
    index.ts
  types.ts
tsconfig.json
vite.config.ts
vitest.config.ts
```

<!-- structure-status: enriched -->
<!-- structure-hash: 284e4b4c1ff613ccb36bf9566ab144cd26989119d5c7e66fc1541d0e350c102d -->
