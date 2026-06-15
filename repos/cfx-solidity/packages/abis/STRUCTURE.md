```text
.gitignore — Git ignore rules
API.md — Public API reference
CHANGELOG.md — Version history
README.md — Package overview and usage
STRUCTURE.md — This file: directory layout documentation
moon.yml — Moonshine build config (re-export, typegen, etc.)
package.json — Package metadata and scripts
src
  erc1155.ts — ERC-1155 ABI (re-export from viem)
  erc165.ts — ERC-165 ABI (re-export from viem)
  erc20.ts — ERC-20 ABI (re-export from viem)
  erc4626.ts — ERC-4626 ABI (re-export from viem)
  erc721.ts — ERC-721 ABI (re-export from viem)
  index.test.ts — Unit tests for main entry
  index.ts — Main entry: re-exports all standard ERC ABIs
  multicall3.ts — Multicall3 ABI (re-export from viem)
  swappi
    factory.ts — Swappi factory ABI
    pair.ts — Swappi pair ABI
    router.ts — Swappi router ABI
  swappi.ts — Swappi entry: re-exports Swappi ABIs
tsconfig.json — TypeScript compiler config
vite.config.ts — Vite build config (for typegen)
vitest.config.ts — Vitest test config
```

<!-- structure-status: enriched -->
<!-- structure-hash: 18dff43c34b2341b7fc7c39c3109a894dcf66cdfeb4e171510bf53fe7cdd410f -->
