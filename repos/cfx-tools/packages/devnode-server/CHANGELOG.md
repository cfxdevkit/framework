# @cfxdevkit/devnode-server

## 2.0.8

### Patch Changes

- 0e194b8: chore(deps): bump all dependencies to latest versions

  - typescript 6 → 7, @typescript/typescript6 added (TS 7 fallback)
  - @types/node, vite, vitest, biome, knip, moonrepo, gitnexus
  - viem, wagmi, @tanstack/react-query
  - next, hono, mermaid, tsx, typebox
  - @noble/ciphers, @noble/hashes (major bump 1→2)
  - - more: postcss, tailwindcss, lucide-react, commander, ledger, happy-dom

- Updated dependencies [0e194b8]
  - @cfxdevkit/cdk@2.0.11
  - @cfxdevkit/contracts@2.0.12
  - @cfxdevkit/devnode@2.1.9
  - @cfxdevkit/compiler@2.0.10
  - @cfxdevkit/devnode-core@2.1.8
  - @cfxdevkit/keystore-server@2.1.8
  - @cfxdevkit/wallet@2.1.9
  - @cfxdevkit/services@2.0.9

## 3.1.1

### Patch Changes

- 1bf81c8: Updated internal build dependencies to ensure correct resolution

## 3.1.0

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

- Updated dependencies [c6e1472]
- Updated dependencies [e9cf877]
- Updated dependencies [e44000a]
  - @cfxdevkit/devnode-core@2.1.0
  - @cfxdevkit/cdk@2.0.1
  - @cfxdevkit/compiler@2.0.1
  - @cfxdevkit/contracts@2.0.2
  - @cfxdevkit/devnode@2.1.0
  - @cfxdevkit/keystore-server@2.1.0
  - @cfxdevkit/services@3.0.1
  - @cfxdevkit/wallet@2.1.0

## 3.0.0

### Major Changes

- f0cb9a2: Removed Swappi V2 Factory and Pair ABI exports.
  Removed contract action routes for register, read, and write operations.
  Removed keystore-related React hooks including useKeystoreAccounts, useKeystoreIdentity, useKeystoreLifecycle, and useKeystoreMutations.
  Removed Ledger Core APDU integration and framing utilities.

### Patch Changes

- c03977e: Reorganized Swappi ABI source files into subdirectories.
  Refactored internal contract route file structure.
  Reorganized keystore hooks and components into subdirectories.
  Refactored internal ledger service file structure.
- Updated dependencies [f0cb9a2]
- Updated dependencies [c03977e]
  - @cfxdevkit/services@3.0.0
  - @cfxdevkit/contracts@2.0.1
  - @cfxdevkit/wallet@2.0.1
  - @cfxdevkit/keystore-server@2.0.1
