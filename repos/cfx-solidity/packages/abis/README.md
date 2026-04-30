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
  ERC721_ABI,
  ERC1155_ABI,
  MULTICALL3_ABI,
  MULTICALL3_ADDRESS,
} from '@cfxdevkit/abis';
```

`@cfxdevkit/contracts/abis` re-exports everything from this package for
back-compat.
