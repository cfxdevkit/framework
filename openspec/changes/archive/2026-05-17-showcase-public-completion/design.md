## Context

Phase 2 is not three separate apps or three separate runtime models. It is one completion pass over the browser-only `showcase-public` keeper. The app already has the correct route structure: `/wallet`, `/core`, and `/keys`. The missing work is additive inside those routes, and all of it shares the same no-backend constraint, the same package manifest, and the same app-level validation.

## Goals / Non-Goals

**Goals:**
- Keep `showcase-public` browser-only while completing the remaining legacy demo surface.
- Extend the existing keeper routes instead of creating replacement route trees.
- Resolve the final `hardware-wallet-showcase` parity decision inside the same implementation stream that ports its surviving behavior.

**Non-Goals:**
- Introducing `@cfxdevkit/devnode-server` or `@cfxdevkit/client` into `showcase-public`.
- Recreating the legacy showcase app structure inside the keeper app.
- Folding SIWE, file-keystore, or backend-only workflows into unrelated public chapters.

## Decisions

- Treat `/wallet`, `/core`, and `/keys` as one merged public-demo completion unit because they share the same app surface, dependency graph, and release gate.
- Preserve existing keeper routes and factor into section components only when maintainability requires it.
- Keep the hardware-wallet port browser-only: memory wallet plus Ledger for `v0.1.0`, with file-keystore explicitly left in `showcase-local`.
- Require a parity-or-supersession decision before deleting `hardware-wallet-showcase`.

## Risks / Trade-offs

- [Phase 2 work lands inconsistently across routes] → Keep the route-level work in one change so validation and deletion gates are managed together.
- [The public app grows too much in single files] → Allow route-local section components as an implementation detail without changing route contracts.
- [Hardware-wallet port introduces backend assumptions] → Keep the `/keys` work constrained to browser-resident and WebHID flows only.
- [Legacy route coverage is declared complete too early] → Tie the merged change to the deletion decision for `hardware-wallet-showcase` and the final Phase 2 validation pass.