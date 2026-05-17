## Why

`showcase-public` is one browser-only keeper app, but its remaining release work was split into three topic changes that all touch the same app root, share the same validation loop, and roll up to the same Phase 2 completion gate. Merging them into one change makes implementation order clearer and keeps `/wallet`, `/core`, and `/keys` aligned as one public-demo surface.

## What Changes

- Extend `/wallet` with the remaining browser-wallet signing, transaction, and dual-space dashboard flows.
- Extend `/core` with the missing block, transaction, receipt, and cross-space lookup examples.
- Extend `/keys` with the browser-memory and Ledger hardware-wallet demos and retire the legacy `hardware-wallet-showcase` app once parity is resolved.

## Capabilities

### New Capabilities
- `showcase-public-wallet-demo`: completes the keeper wallet chapter with signing, transaction, and richer dual-space actions.
- `showcase-public-core-demo`: completes the keeper RPC chapter with deeper lookup and cross-space read examples.
- `showcase-public-hardware-wallet`: adds the keeper hardware-wallet demo to the keys chapter.

### Modified Capabilities
- None.

## Impact

- Affected code: `projects/examples/apps/showcase-public/app/wallet/**`, `projects/examples/apps/showcase-public/app/core/**`, `projects/examples/apps/showcase-public/app/keys/**`, `projects/examples/apps/showcase-public/package.json`.
- Affected systems: public showcase route coverage, browser-side wallet demos, WebHID integration, legacy example retirement sequencing.