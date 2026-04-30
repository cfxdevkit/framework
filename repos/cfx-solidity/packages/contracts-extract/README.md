# @cfxdevkit/codegen-contracts

Extracts ABI and bytecode from Hardhat artifacts and renders TypeScript modules consumed by [`@cfxdevkit/contracts`](../../../framework/contracts).

> **Status:** Phase A scaffold — empty package. Implementation pending.

## CLI

```bash
pnpm exec cfxdevkit-extract-contracts <artifacts-dir> --out framework/contracts/src/generated
```

See [tools/STRUCTURE.md](../../STRUCTURE.md) for the planned `extract.ts` / `render.ts` split.
