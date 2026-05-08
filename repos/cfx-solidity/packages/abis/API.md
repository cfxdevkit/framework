# @cfxdevkit/abis — Public API

> Stable EVM ABI constants with zero internal workspace dependencies. Intended for use in TypeScript-based dApps and tooling.

## Exports

```ts
const ERC20_ABI: Abi
type ERC20_ABI = typeof ERC20_ABI

const ERC20_EXTENDED_ABI: Abi
type ERC20_EXTENDED_ABI = typeof ERC20_EXTENDED_ABI

const ERC165_ABI: Abi
type ERC165_ABI = typeof ERC165_ABI

const ERC721_ABI: Abi
type ERC721_ABI = typeof ERC721_ABI

const ERC721_ENUMERABLE_ABI: Abi
type ERC721_ENUMERABLE_ABI = typeof ERC721_ENUMERABLE_ABI

const ERC721_EXTENDED_ABI: Abi
type ERC721_EXTENDED_ABI = typeof ERC721_EXTENDED_ABI

const ERC1155_ABI: Abi
type ERC1155_ABI = typeof ERC1155_ABI

const ERC2612_ABI: Abi
type ERC2612_ABI = typeof ERC2612_ABI

const ERC2981_ABI: Abi
type ERC2981_ABI = typeof ERC2981_ABI

const ERC4626_ABI: Abi
type ERC4626_ABI = typeof ERC4626_ABI

const MULTICALL3_ABI: Abi
type MULTICALL3_ABI = typeof MULTICALL3_ABI

const MULTICALL3_ADDRESS: "0xcA11bde05977b3631167028862bE2a173976CA11"
```

Camel-case aliases are also exported for compatibility with viem and older DevKit package surfaces:

```ts
erc20Abi
erc20ExtendedAbi
erc165Abi
erc721Abi
erc721EnumerableAbi
erc721ExtendedAbi
erc1155Abi
erc2612Abi
erc2981Abi
erc4626Abi
multicall3Abi
```

## Notes

- All ABI constants are re-exported from `viem` under workspace-stable names.
- `ERC2612_ABI` and the extended ERC ABIs are defined locally because viem does not ship those extension bundles as a single standard export.
- `ERC165_ABI`, `ERC721_ENUMERABLE_ABI`, and `ERC2981_ABI` are included because they are common low-level building blocks for NFT and marketplace tooling.
- `MULTICALL3_ADDRESS` is the canonical EVM deployment address; callers must still
  verify support on the target chain before use.

## Example

```ts
import { ERC20_ABI, ERC2612_ABI, ERC4626_ABI, MULTICALL3_ADDRESS } from '@cfxdevkit/abis';
```