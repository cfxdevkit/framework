# @cfxdevkit/react — React bindings for Conflux DevKit

## Root files
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `moon.yml` — Moon repo workspace config  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite build config (for dev/test)  
- `vitest.config.ts` — Vitest test config  

## `src/`
- `account.ts` — Account utilities and types  
- `balance.ts` — Balance querying hooks/utilities  
- `context.tsx` — Core React context provider  
- `contract.ts` — Contract interaction hooks/utilities  
- `events.ts` — Event subscription helpers  
- `index.test.ts` — Root-level unit tests  
- `index.ts` — Main entry point (re-exports)  
- `keystore/` — Keystore and wallet management module  
  - `context.tsx` — Keystore context provider  
  - `index.ts` — Keystore module entry point  
  - `keystore-mutations.test.tsx` — Keystore mutation tests  
  - `keystore.test.tsx` — Keystore core tests  
  - `types.ts` — Keystore-related TypeScript types  
  - `use-keystore-accounts.ts` — Hook for keystore accounts  
  - `use-keystore-identity.ts` — Hook for identity management  
  - `use-keystore-lifecycle.ts` — Hook for wallet lifecycle events  
  - `use-keystore-mutations.ts` — Hook for keystore actions (sign, unlock, etc.)  
  - `use-keystore-wallets.ts` — Hook for wallet list management  
  - `wallet-shell.test.tsx` — Wallet shell component tests  
  - `wallet-shell.tsx` — Wallet shell UI component  
  - `wallet-switchers.test.tsx` — Wallet switcher tests  
- `tx.ts` — Transaction signing and submission helpers  

Directory tree:
```
.gitignore
API.md
README.md
STRUCTURE.md
moon.yml
package.json
src/
  account.ts
  balance.ts
  context.tsx
  contract.ts
  events.ts
  index.test.ts
  index.ts
  keystore/
    context.tsx
    index.ts
    keystore-mutations.test.tsx
    keystore.test.tsx
    types.ts
    use-keystore-accounts.ts
    use-keystore-identity.ts
    use-keystore-lifecycle.ts
    use-keystore-mutations.ts
    use-keystore-wallets.ts
    wallet-shell.test.tsx
    wallet-shell.tsx
    wallet-switchers.test.tsx
  tx.ts
tsconfig.json
vite.config.ts
vitest.config.ts
```

<!-- structure-status: enriched -->
<!-- structure-hash: 0ddca1f1a3cf2e0e943de595095d034aed197222187a58fd52ef4d7169dcef4b -->
