# @cfxdevkit/keystore-server

## 2.1.8

### Patch Changes

- 165d8b0: chore(deps): bump all dependencies to latest versions

  - typescript 6.0.3 → 7.0.2, @typescript/typescript6 added (TS 7 fallback)
  - @types/node 25 → 26
  - vite 8.0.16 → 8.1.3, vitest 4.1.9 → 4.1.10
  - @biomejs/biome 2.5.0 → 2.5.3
  - viem 2.52.2 → 2.54.6, wagmi 3.6.16 → 3.7.0
  - next 16.2.9 → 16.2.10, hono 4.12.25 → 4.12.28
  - @noble/ciphers 1.3.0 → 2.2.0, @noble/hashes 1.8.0 → 2.2.0
  - - more: postcss, tailwindcss, typebox, mermaid, tsx, lucide-react, commander, ledger, happy-dom

- Updated dependencies [165d8b0]
- Updated dependencies [ba6947c]
- Updated dependencies [05dedb6]
  - @cfxdevkit/cdk@2.0.11
  - @cfxdevkit/services@2.0.9

## 2.1.0

### Minor Changes

- e9cf877: Added standard ERC-2612, ERC-20, ERC-721, ERC-1155, ERC-4626, and Multicall3 ABIs with SWAPPI contract bindings
  Updated package documentation
  Updated package documentation
  Added node health check functionality to client API
  Updated package documentation
  Updated package documentation
  Expanded DeFi React hooks and UI components for portfolio, pools, and swap functionality
  Added command-line argument options for devnode configuration
  Expanded devnode core API with network configuration, mining, and account management routes
  Expanded devnode server API with node profile management and CLI support
  Changed RetryPolicy interface from maxAttempts/initialDelayMs to maxRetries/baseDelayMs
  Expanded keystore server API with wallet management and secret reveal functionality
  Updated package documentation
  Expanded React hooks for account, balance, contract, and transaction management
  Updated package documentation
  Expanded signer session API with support for file keystore, Ledger, memory, and OneKey backends
  Updated package documentation
  Expanded theme API with design tokens and React theme provider
  Added Metric, StatusGrid, and SegmentedControl UI components
  Updated package documentation
  Expanded wallet API with transaction batching, session keys, and hardware wallet support
  Expanded wallet-connect API with Wagmi integration and SIWE message support

### Patch Changes

- Updated dependencies [e9cf877]
- Updated dependencies [e44000a]
  - @cfxdevkit/cdk@2.0.1
  - @cfxdevkit/services@3.0.1

## 2.0.1

### Patch Changes

- Updated dependencies [f0cb9a2]
- Updated dependencies [c03977e]
  - @cfxdevkit/services@3.0.0
