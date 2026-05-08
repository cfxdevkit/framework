# @cfxdevkit/abis

Standard EVM ABI shapes used across the devkit. The definitions are sourced
from [`viem`](https://viem.sh) (which tracks the canonical EIP interfaces) and
re-exported under framework-stable aliases so the rest of the devkit — and any
external consumer — can depend on a tiny, leaf package without pulling
contract-execution machinery.

## Why a separate package?

* **Zero cfxdevkit dependencies** — only `viem`. Anything in the devkit
  (including `@cfxdevkit/core`) can consume it without creating a cycle.
* **Tiny surface** — just constants. No runtime; no environment requirements.
* **Stable** — the viem aliases insulate downstream code from upstream
  re-exports churn.

## Usage

```ts
import {
  ERC20_ABI,
  ERC20_EXTENDED_ABI,
  ERC2612_ABI,
  ERC4626_ABI,
  ERC721_ABI,
  ERC721_EXTENDED_ABI,
  ERC1155_ABI,
  MULTICALL3_ABI,
  MULTICALL3_ADDRESS,
} from '@cfxdevkit/abis';
```

## Included Standards

- ERC-20, ERC-721, ERC-1155, and Multicall3 from viem.
- ERC-2612 permit for signature-based approvals.
- ERC-4626 tokenized vaults.
- ERC-165 interface detection, ERC-721 enumerable, and ERC-2981 royalties.
- Extended ERC-20/ERC-721 bundles matching the OpenZeppelin-style DevKit template contracts.

`@cfxdevkit/contracts/abis` re-exports everything from this package for
back-compat.
