# @cfxdevkit/wallet-connect

Directory structure:

Directory tree:
```
.gitignore
API.md
README.md
STRUCTURE.md
moon.yml
package.json
src
  auth
    index.tsx — Auth flow entry point (e.g., SIWE-based session initiation)
  config
    chains.test.ts — Chain configuration unit tests
    chains.ts — Supported chain definitions (Conflux, EVM)
    createConfig.tsx — WalletConnect config factory hook
    index.ts — Config module re-exports
  hooks
    index.ts — Hooks module re-exports
    useCoreWallet.ts — Core wallet state & actions hook
    useEspaceConnectors.ts — EVM connector discovery hook
  index.test.ts — Package-level integration tests
  index.ts — Main entry point
  lib
    coreWalletPrimitives.test.ts — Core wallet utility tests
    coreWalletPrimitives.ts — Core wallet logic (e.g., signing, balance)
    err.ts — Shared error types & helpers
    switchConfluxChain.ts — Chain switching logic for Conflux
    walletState.test.ts — Wallet state machine tests
    walletState.ts — Wallet state management & transitions
  siwe
    createMessage.ts — SIWE message builder
    index.test.ts — SIWE module tests
    index.ts — SIWE module re-exports
    nonce.ts — Nonce generation utilities
    parse.ts — SIWE message parser
    types.ts — SIWE-related TypeScript types
    verify.ts — SIWE signature verification
  ui
    ConnectButton.tsx — UI button for initiating connection
    WalletPickerModal.tsx — Modal for selecting wallet/provider
    index.ts — UI module re-exports
tsconfig.json
vite.config.ts
vitest.config.ts
```

<!-- structure-status: enriched -->
<!-- structure-hash: 86568c291b499ae90e977f14e626aa4743d62ba0d55d26723f82cb892b3b7abc -->
