# `@cfxdevkit/abis` — Public API

> Standard EVM ABI shapes (ERC-20/721/1155, Multicall3) re-exported from viem under framework-stable aliases. Zero cfxdevkit dependencies.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 23 symbols |
| `./swappi` | 6 symbols |

---

## `.`

```ts
// Standard ERC-2612 (Permit) ABI for EIP-2612 compatible tokens
export declare const ERC2612_ABI: readonly [
export declare const erc2612Abi: readonly [

// Standard ERC-20 (Fungible Token) ABI
export declare const ERC20_ABI: readonly [
export declare const erc20Abi: readonly [

// Extended ERC-20 ABI including optional methods like `name`, `symbol`, `decimals`
export declare const ERC20_EXTENDED_ABI: readonly [
export declare const erc20ExtendedAbi: readonly [

// Standard ERC-165 (Interface Detection) ABI
export declare const ERC165_ABI: readonly [
export declare const erc165Abi: readonly [

// Standard ERC-721 (Non-Fungible Token) ABI
export declare const ERC721_ABI: readonly [
export declare const erc721Abi: readonly [

// ERC-721 with Enumerable extension (allows iteration over token IDs)
export declare const ERC721_ENUMERABLE_ABI: readonly [
export declare const erc721EnumerableAbi: readonly [

// ERC-2981 (Royalty Information) ABI for NFT royalty handling
export declare const ERC2981_ABI: readonly [
export declare const erc2981Abi: readonly [

// Extended ERC-721 ABI including optional methods like `tokenURI`
export declare const ERC721_EXTENDED_ABI: readonly [
export declare const erc721ExtendedAbi: readonly [

// Standard ERC-1155 (Multi-Token) ABI
export declare const ERC1155_ABI: readonly [
export declare const erc1155Abi: readonly [

// ERC-4626 (Tokenized Vault) ABI for yield-bearing vaults
export declare const ERC4626_ABI: readonly [
export declare const erc4626Abi: readonly [

// Multicall3 ABI for batched contract calls
export declare const MULTICALL3_ABI: readonly [
export declare const multicall3Abi: readonly [

// Address of the Multicall3 contract on mainnet and most testnets
export declare const MULTICALL3_ADDRESS: "0xcA11bde05977b3631167028862bE2a173976CA11";
```

### Usage

```ts
import { erc20Abi, multicall3Abi, MULTICALL3_ADDRESS } from '@cfxdevkit/abis'
```

---

## `./swappi`

```ts
// SWAPPI Factory ABI for pool creation and registry
export { SWAPPI_FACTORY_ABI }

// SWAPPI Pair ABI for liquidity pool operations (e.g., `getReserves`, `swap`)
export { SWAPPI_PAIR_ABI }

// SWAPPI Router ABI for swap, add/remove liquidity, and path handling
export { SWAPPI_ROUTER_ABI }

// Address of the SWAPPI Factory contract
export declare const SWAPPI_FACTORY_ADDRESS: {

// Address of the SWAPPI Router contract
export declare const SWAPPI_ROUTER_ADDRESS: {

// Address of the wrapped CFX (WCFX) token
export declare const WCFX_ADDRESS: {
```

### Usage

```ts
import { SWAPPI_ROUTER_ABI, SWAPPI_ROUTER_ADDRESS, WCFX_ADDRESS } from '@cfxdevkit/abis/swappi'
```

<!-- api-hash: 2cd1b4fc9fd320342c4aca3a659dd02549773804208e0391358c804fc94c0a12 -->
