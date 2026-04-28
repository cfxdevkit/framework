# framework/react

**Scope:** Headless React hooks + components on top of `framework/core`.

**Responsibilities**
- `useChainClient`, `useContractRead`, `useContractWrite` (or equivalents)
- React-Query integrated data hooks
- No styling assumptions (headless)

Depends on: `core`. Optional peer: `framework/wallet-connect` for wallet-aware hooks.
