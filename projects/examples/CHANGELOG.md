# Changelog

## [2026-05-04]
### Changed
- Updated `@vitejs/plugin-react` from `^4.3.0` to `^6.0.1` in `showcase-browser`, `showcase-stack`, and `showcase` apps.



## 2026-05-04

### Changed

- Updated projects/examples files: projects/examples/apps/showcase-browser/src/lib/use-core-wallet.ts, projects/examples/apps/showcase-browser/src/panels/DualSpacePanel.tsx, projects/examples/apps/showcase-browser/src/panels/UnifiedSendPanel.tsx, projects/examples/apps/showcase-browser/src/panels/UnifiedSignPanel.tsx, projects/examples/apps/showcase-browser/src/panels/WalletConnectPanel.tsx, projects/examples/apps/showcase-browser/src/styles.css, projects/examples/apps/showcase-stack/src/components/WalletBar.tsx, projects/examples/apps/showcase-stack/src/panels/CompilerPanel.tsx, projects/examples/apps/showcase-stack/src/panels/ContractPanel.tsx, projects/examples/apps/showcase-stack/src/panels/DevNodePanel.tsx, projects/examples/apps/showcase-stack/src/panels/SessionKeyPanel.tsx, projects/examples/apps/showcase-stack/src/panels/SiwePanel.tsx, and 55 more.

## [Unreleased] - 2026-05-02
### Changed
- Renamed `@cfxdevkit/example-showcase` to `@cfxdevkit/showcase` in the main showcase app README.
- Updated `projects/examples/README.md` to clarify tier structure: apps are Tier 3, shared packages are Tier 2, and added explicit import rules.
- Updated `showcase-backend` README to use full words (e.g., "authentication" instead of "auth", "cataloguing" instead of "catalogues").
- Updated `showcase-stack` README to clarify wallet compatibility ("eSpace-compatible" instead of "eSpace wallet").
- Refined `useCoreWallet` return type in `showcase-ui/API.md` to include explicit fields: `status`, `provider`, and `error`.
- Added `CHANGELOG.md` file for the examples scope.



## [Unreleased] - 2026-05-02
### Changed
- Renamed `@cfxdevkit/example-showcase` package to `@cfxdevkit/showcase` in `apps/showcase/` README.
- Updated `projects/examples/README.md` to reflect Tier 3 for apps and Tier 2 for shared packages, clarifying import restrictions.
- Corrected backend service tier from Tier 3 to Tier 1 in `apps/showcase-backend/` README.
- Refined `showcase-backend` description: SIWE *authentication*, *cataloguing*, and *eSpace-compatible* wallet wording.
- Updated `showcase-stack` instructions to clarify non-Fluent *eSpace-compatible* wallet usage.
- Improved `useCoreWallet` return type in `packages/showcase-ui/API.md` to explicit `{ status, provider, error }` shape.

## [Unreleased] - 2026-05-02
### Changed
- Renamed `@cfxdevkit/example-showcase` package to `@cfxdevkit/showcase` in `apps/showcase/README.md`.
- Updated `projects/examples/README.md` to reflect Tier 3 for apps and Tier 2 for shared packages, clarifying import restrictions.
- Added explicit type definitions for `useCoreWallet` return value in `packages/showcase-ui/API.md`.
- Corrected terminology in `apps/showcase-backend/README.md`: 'auth' → 'authentication', 'catalogues' → 'cataloguing'.
- Clarified wallet compatibility in `apps/showcase-stack/README.md`: 'non-Fluent eSpace wallet' → 'non-Fluent eSpace-compatible wallet'.


All notable changes to this package are documented here.

