# `@cfxdevkit/abis` — Public API

> Standard EVM ABI shapes (ERC-20/721/1155, Multicall3) re-exported from viem under framework-stable aliases. Zero cfxdevkit dependencies.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 23 symbols |
| `./swappi` | 6 symbols |

---

## `.`

### Usage

```typescript
import { ERC20_ABI } from '@cfxdevkit/abis';
```

```ts
// ERC2612 ABI constant — includes permit, nonces, and domain separator functions for EIP-2612 (gasless approvals)
export declare const ERC2612_ABI: readonly [
  // erc2612Abi
];

// ERC2612 ABI — alias for ERC2612_ABI, includes permit, nonces, and domain separator functions for EIP-2612 (gasless approvals)
export declare const erc2612Abi: readonly [
  // erc20_ABI
];

// ERC20 ABI constant — core ERC-20 token interface (balanceOf, transfer, approve, etc.)
export declare const ERC20_ABI: readonly [
  // erc20Abi
];

// ERC20 ABI — alias for ERC20_ABI, core ERC-20 token interface (balanceOf, transfer, approve, etc.)
export declare const erc20Abi: readonly [
  // ERC20_EXTENDED_ABI
];

// ERC20 extended ABI constant — ERC-20 + EIP-2612 (permit) + optional metadata (name, symbol, decimals)
export declare const ERC20_EXTENDED_ABI: readonly [
  // erc20ExtendedAbi
];

// ERC20 extended ABI — alias for ERC20_EXTENDED_ABI, ERC-20 + EIP-2612 (permit) + optional metadata (name, symbol, decimals)
export declare const erc20ExtendedAbi: readonly [
  // ERC165_ABI
];

// ERC165 ABI constant — interface detection standard (supportsInterface)
export declare const ERC165_ABI: readonly [
  // erc165Abi
];

// ERC165 ABI — alias for ERC165_ABI, interface detection standard (supportsInterface)
export declare const erc165Abi: readonly [
  // erc721_ABI
];

// ERC721 ABI constant — core ERC-721 non-fungible token interface (ownerOf, approve, getApproved, etc.)
export declare const ERC721_ABI: readonly [
  // erc721_ENUMERABLE_ABI
];

// ERC721 Enumerable ABI constant — ERC-721 + enumeration extensions (totalSupply, tokenOfOwnerByIndex, tokenByIndex)
export declare const ERC721_ENUMERABLE_ABI: readonly [
  // ERC2981_ABI
];

// ERC2981 Royalty ABI constant — standard royalty information for NFTs (royaltyInfo)
export declare const ERC2981_ABI: readonly [
  // ERC721_EXTENDED_ABI
];

// ERC721 extended ABI constant — ERC-721 + Enumerable + ERC2981 + optional metadata (name, symbol, tokenURI)
export declare const ERC721_EXTENDED_ABI: readonly [
  // ERC1155_ABI
];

// ERC1155 ABI constant — multi-token standard interface (balanceOf, safeTransferFrom, setApprovalForAll, etc.)
export declare const ERC1155_ABI: readonly [
  // ERC4626_ABI
];

// ERC4626 Tokenized Vault ABI constant — tokenized vault standard (deposit, withdraw, convertToShares, convertToAssets, etc.)
export declare const ERC4626_ABI: readonly [
  // multicall3Abi
];

// Multicall3 ABI constant — batched call aggregation interface (aggregate, tryAggregate, getBlockTimestamp, etc.)
export declare const MULTICALL3_ABI: readonly [
  // MULTICALL3_ADDRESS
];

// Multicall3 ABI — alias for MULTICALL3_ABI, batched call aggregation interface
export declare const multicall3Abi: readonly [
  // MULTICALL3_ADDRESS
];

// Multicall3 address — deployment address of Multicall3 contract on mainnet and testnets
export declare const MULTICALL3_ADDRESS: any;
```

---

## `./swappi`

### Usage

```typescript
import { SWAPPI_ROUTER_ABI } from '@cfxdevkit/abis/swappi';
```

```ts
// Swappi Factory ABI — interface for Swappi DEX factory contract (pair creation, getPair, allPairsLength, etc.)
export declare const SWAPPI_FACTORY_ABI;

// Swappi Pair ABI — interface for Swappi DEX pair contract (swap, skim, sync, price0CumulativeLast, etc.)
export declare const SWAPPI_PAIR_ABI;

// Swappi Router ABI — interface for Swappi DEX router contract (addLiquidity, removeLiquidity, swapExactTokensForTokens, etc.)
export declare const SWAPPI_ROUTER_ABI;

// Swappi Factory address — deployment address of Swappi Factory contract
export declare const SWAPPI_FACTORY_ADDRESS: {
  // WCFX address — wrapped CFX token address used by Swappi for ETH-like pair
  export declare const WCFX_ADDRESS: {
};
```

### Usage

```typescript
import { ERC2612_ABI, erc2612Abi, ERC20_ABI, erc20Abi, ERC20_EXTENDED_ABI, erc20ExtendedAbi, ERC165_ABI, erc165Abi, ERC721_ABI, erc721Abi, ERC721_ENUMERABLE_ABI, erc721EnumerableAbi, ERC2981_ABI, erc2981ABI, ERC721_EXTENDED_ABI, erc721ExtendedAbi, ERC1155_ABI, erc1155Abi, ERC4626_ABI, erc4626Abi, MULTICALL3_ABI, multicall3Abi, MULTICALL3_ADDRESS, SWAPPI_FACTORY_ABI, SWAPPI_PAIR_ABI, SWAPPI_ROUTER_ABI, SWAPPI_FACTORY_ADDRESS, WCFX_ADDRESS } from '@cfxdevkit/abis';

// Example usage of ERC2612_ABI
const erc2612AbiExample = erc2612Abi;

// Example usage of SWAPPI_FACTORY_ABI
const swappiFactoryAbiExample = SWAPPI_FACTORY_ABI;
```

<!-- api-hash: 6c5c6e6fe9050631ba637aa5567444ab573dd71382a47e7e0890270dfec7c354 -->
