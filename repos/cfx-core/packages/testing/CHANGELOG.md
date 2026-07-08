# @cfxdevkit/testing

## 2.0.10

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
  - @cfxdevkit/devnode@2.1.9

## 2.0.1

### Patch Changes

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
- Updated dependencies [e9cf877]
  - @cfxdevkit/cdk@2.0.1
  - @cfxdevkit/devnode@2.1.0
