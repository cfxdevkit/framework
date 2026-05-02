# `@cfxdevkit/game-engine` — API Reference

> Status: **Phase A scaffold** — empty package. This document will be filled out as the implementation lands. See [STRUCTURE.md](./STRUCTURE.md) for the planned layout.

## Public Exports

_None yet — package currently exports only `__packageName` as a smoke marker._

## Planned Surface

See the package's [STRUCTURE.md](./STRUCTURE.md) for the documented intent of each sub-folder. Once implemented, every public symbol will be re-exported from `./src/index.ts` and listed here with its signature, parameters, return type, errors, and a runnable example.

## Internal Workspace Dependencies

```json
{
  "@cfxdevkit/contracts": "workspace:^",
  "@cfxdevkit/core": "workspace:^"
}
```

## Tier

Defined per [ARCHITECTURE.md](../../../../../ARCHITECTURE.md). Dependencies must respect the one-way rule: `projects → domains → platform → framework`.
