# Changelog


## [Unreleased] - 2026-05-02
### Changed
- Added description to `README.md` explaining that `cfx-ui` contains React-based UI surface packages for `@cfxdevkit/*`, published as scoped npm modules.
- Updated `API.md` to emphasize that all hooks are built on `core` primitives and expose no internal state management, reinforcing the design principle of external state management via TanStack Query and minimal context.

## [Unreleased] - 2026-05-02
### Changed
- Renamed `framework/defi-react` to `@cfxdevkit/defi-react` across API, README, and STRUCTURE docs.
- Renamed `framework/theme` to `@cfxdevkit/theme` across API, README, and STRUCTURE docs.
- Renamed `framework/wallet-connect` to `@cfxdevkit/wallet-connect` across API, README, and STRUCTURE docs.
- Updated dependency references in `defi-react` from `framework/core`, `framework/react`, `framework/services` to `@cfxdevkit/core`, `@cfxdevkit/react`, `@cfxdevkit/services`.
- Updated `react/API.md` to clarify state management as external via TanStack Query and minimal client context.
- Updated `wallet-connect/README.md` and `wallet-connect/STRUCTURE.md` to clarify usage of `@cfxdevkit/wallet-connect`.


All notable changes to this package are documented here.

