## Why

The backend and shared client now expose the correct dual-chain keystore model, but the user-facing experience is still fragmented across showcase-local panels and one large app-local runtime hook. Users do not get a browser-wallet-style flow for creating or unlocking the keystore, choosing a mnemonic wallet root, or switching the active derived account, and the framework still lacks a reusable React surface for these behaviors.

This change consolidates the keystore experience into reusable `@cfxdevkit/react` hooks and headless wallet-shell components, then adopts that surface in showcase-local as the first consumer. It also locks the UX to the current dual-chain identity model so every selected account is represented as paired eSpace/Core addresses and derivation paths.

## What Changes

- Add reusable, network-agnostic keystore hooks to `@cfxdevkit/react` for lifecycle state (`blank`, `locked`, `unlocked`, `active-wallet`), wallet-root management, derived-account selection, and the active dual-chain identity.
- Add headless keystore wallet-shell components to `@cfxdevkit/react` for distinct blank/locked entry surfaces, a persistent identity strip, wallet/account dropdown overlays, and an optional portfolio slot.
- Refactor showcase-local to consume the reusable keystore hooks/components instead of defining the keystore lifecycle and selection model inside app-local panel code.
- Align the new React surface and showcase-local UX with the current dual-chain field names and semantics from `@cfxdevkit/client`: `accountType`, `espaceAddress`, `coreAddress`, `espaceDerivationPath`, and `coreDerivationPath`.
- Preserve showcase-local as a consumer and themed example: app-local code may compose, theme, and augment the reusable shell, but should not redefine the underlying keystore data model or state machine.

## Capabilities

### New Capabilities
- `react-keystore-hooks`: Reusable React provider and hooks for keystore lifecycle, wallet-root selection, derived-account selection, and active dual-chain identity over `@cfxdevkit/client`.
- `react-keystore-wallet-shell`: Headless React wallet-shell components for keystore onboarding, identity display, and wallet/account switching that can be styled by consumers.

### Modified Capabilities
- None.

## Impact

- Affected code: `repos/cfx-ui/packages/react`, `projects/examples/apps/showcase-local`, and any docs or examples that describe the React package surface.
- Affected APIs: new `@cfxdevkit/react` keystore exports and any showcase-local component contracts that currently depend on app-local keystore state wiring.
- Affected systems: reusable framework React consumers, showcase-local keystore onboarding and wallet switching UX, and future components that need a shared wallet/account control surface.
- Data model constraint: the React surface must treat each selected account as a dual-chain identity rooted in one mnemonic wallet and one derived index, not as a single-address wallet abstraction.
