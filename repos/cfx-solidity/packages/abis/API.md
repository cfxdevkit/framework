# @cfxdevkit/abis — Public API

> Stable EVM ABI constants with zero internal workspace dependencies.

## Exports

```ts
const ERC20_ABI: Abi
type ERC20_ABI = typeof ERC20_ABI

const ERC721_ABI: Abi
type ERC721_ABI = typeof ERC721_ABI

const ERC1155_ABI: Abi
type ERC1155_ABI = typeof ERC1155_ABI

const MULTICALL3_ABI: Abi
type MULTICALL3_ABI = typeof MULTICALL3_ABI

const MULTICALL3_ADDRESS: "0xcA11bde05977b3631167028862bE2a173976CA11"
```

## Notes

- All ABI constants are re-exported from `viem` under workspace-stable names.
- `MULTICALL3_ADDRESS` is the canonical EVM deployment address; callers must still
  verify support on the target chain before use.

## Example

```ts
import { ERC20_ABI, MULTICALL3_ADDRESS } from '@cfxdevkit/abis';
```