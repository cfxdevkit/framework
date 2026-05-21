# cfx-solidity

**Solidity pipeline.** Independent carve-out — standard ABIs, contract
bindings, and the Solidity compilation pipeline. Usable on its own without
pulling the rest of the devkit.

## Packages

| Package | npm | Surface |
|---------|-----|---------|
| `abis` | `@cfxdevkit/abis` | Standard ABI shapes (ERC-20/721/1155, Multicall3) |
| `contracts` | `@cfxdevkit/contracts` | Read/write/deploy + ERC-20 helpers + Conflux bridge |
| `compiler` | `@cfxdevkit/compiler` | Solidity compile pipeline (solc loader, resolvers, templates, artifacts) |
| `contracts-extract` | `@cfxdevkit/contracts-extract` | Hardhat artifact → TS module codegen |

## Layering

```
abis           → viem only (zero cfxdevkit deps)
contracts      → abis + @cfxdevkit/cdk + viem
compiler       → @cfxdevkit/cdk + solc + viem (devDep on contracts/devnode for tests)
contracts-extract → standalone CLI
```
