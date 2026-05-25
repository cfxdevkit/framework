# @cfxdevkit/abis

Standard EVM ABI shapes used across the devkit. The definitions are sourced
from [`viem`](https://viem.sh) (which tracks the canonical EIP interfaces) and
re-exported under framework-stable aliases so the rest of the devkit — and any
external consumer — can depend on a tiny, leaf package without pulling
contract-execution machinery.

## Why a separate package?

* **Zero cfxdevkit dependencies** — only `viem`. Anything in the devkit
  (including `@cfxdevkit/cdk`) can consume it without creating a cycle.
* **Tiny surface** — just constants. No runtime; no environment requirements.
* **Stable** — the viem aliases insulate downstream code from upstream
  re-exports churn.

## Installation

```bash
npm install @cfxdevkit/abis
```

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
  ERC165_ABI,
  ERC721_ENUMERABLE_ABI,
  ERC2981_ABI,
  MULTICALL3_ABI,
  MULTICALL3_ADDRESS,
} from '@cfxdevkit/abis';
```

For Swappi-specific ABIs and addresses:

```ts
import {
  SWAPPI_FACTORY_ABI,
  SWAPPI_PAIR_ABI,
  SWAPPI_ROUTER_ABI,
  SWAPPI_FACTORY_ADDRESS,
  SWAPPI_ROUTER_ADDRESS,
  WCFX_ADDRESS,
} from '@cfxdevkit/abis/swappi';
```

## Included Standards

- **Core standards**: ERC-20, ERC-721, ERC-1155, and Multicall3 (from viem).
- **Extensions**: ERC-2612 (permit), ERC-4626 (tokenized vaults), ERC-165 (interface detection), ERC-721 enumerable, and ERC-2981 (royalties).
- **Extended bundles**: OpenZeppelin-style extended ABIs for ERC-20 and ERC-721, matching DevKit template contracts.
- **Swappi**: Factory, Pair, and Router ABIs and addresses for the Swappi DEX protocol.

`@cfxdevkit/contracts/abis` re-exports everything from this package for
back-compat.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 23 symbols |
| `./swappi` | 6 symbols |

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 0 — framework** — Must not runtime-import from any higher tier.

<!-- readme-hash: 34da9151afcb61387333d03187380256b465da365b6e2b2e5346c3959d75a70e -->
