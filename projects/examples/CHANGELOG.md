# Changelog


## [Unreleased] - 2026-05-05
### Changed
- Updated topbar layout in hardware-wallet-showcase to use column direction and reduced gap from 20px to 12px
- Removed CSS custom properties and simplified header layout in showcase-browser
- Enhanced panel styling with backdrop-filter, rounded corners, hover effects, and transitions
- Redesigned hero section in showcase-gateway with improved grid, typography, and visual depth using background image and gradients
- Updated routes panel and section cards with refined spacing, hover states, and glow effects
- Replaced local `BackendPill` component with shared `SharedDevNodePill` in showcase-stack
- Removed `BackendPill.tsx` component file from showcase-stack
- Added hero background image (`hero-bg.png`) to showcase-gateway public assets

## [Unreleased] - 2026-05-05
### Changed
- Renamed `hardware-wallet-showcase` app to `keystore-management-showcase` and updated all references in README, package.json, and tests.
- Updated gateway path from `/hardware/` to `/keystores/` across documentation and configuration files.
- Refactored `App.tsx` to use new `KeystoreWorkspace`, `KeystoreBackendDetails`, and `wallet-controller-*` modules for modular backend support.
- Replaced monolithic UI with dedicated workspace components (`ledger-workspace.tsx`, `managed-keystore-workspace.tsx`, `file-keystore-client.ts`, `wallet-controller-memory.ts`, `wallet-controller-ledger.ts`).
- Added new keystore backend implementations and backend routes in `showcase-backend/src/keystore/` for file management, deployment, transaction signing, and routing.
- Introduced `keystore-session-context.ts` and `devnode-pill-popover.tsx` to improve session and devnode state handling in `/showcase/`.
- Added new UI components: `CopyButton`, `DerivePanel`, `MnemonicPanel`, `devnode-forms.tsx`, `session-key-account-picker.tsx`, `compiler-catalog-hook.ts`, and `contract-interaction-hooks.ts`.
- Updated `SHOWCASE-COVERAGE.md` and root `README.md` to reflect `/keystores/` instead of `/hardware/` in navigation and coverage mapping.



## [Unreleased] - 2026-05-05
### Added
- `apps/showcase-gateway/` — unified development entry point and reverse proxy for all showcase apps, accessible via `pnpm showcase` at `http://127.0.0.1:5173`
- `apps/hardware-wallet-showcase/` keystore management coverage: memory, encrypted file, Ledger, and reserved OneKey/Satochip slots
- `packages/showcase-ui/src/devnode.tsx`, `shell.tsx`, `theme.css` — shared UI primitives for backend/devnode controls, navigation, and theming
### Changed
- `apps/hardware-wallet-showcase/` renamed from hardware wallet showcase to keystore management showcase with new `keystore-demo.ts`, `keystore-ui.tsx`, `wallet-controller-keystore.ts`, and `styles-keystore.css`
- `README.md` updated with gateway workflow, linear walkthrough, and coverage gap guidance
- `packages/showcase-ui` description updated to reflect shared theme, shell, sidebar, and wallet UI primitives
- All showcase apps updated to use `@cfxdevkit/example-showcase-ui` and `@cfxdevkit/services` where applicable
### Fixed
- CSS variables standardized across hardware-wallet-showcase styles to use theme tokens (`--accent`, `--border`, `--muted`, etc.)
### Removed
- Legacy base styles in `styles-base.css` replaced with theme-aware variables
### Risks
- Gateway proxying introduces new routing complexity; ensure path-based routing aligns with Vite dev server port drift behavior
- Keystore backend matrix may require additional adapter support for OneKey/Satochip backends
- Theme token adoption in legacy apps may cause visual inconsistencies if not uniformly applied

## [Unreleased] - 2026-05-05
### Changed
- Updated `App.tsx` to disable message signing when wallet mode is `core`, as Core app `2.2.2` does not expose message signing.
- Added informational note in `App.tsx` explaining Core message signing limitation and `SIGN_TX` APDU usage for transactions.
- Extended `TransferPanel` in `wallet-ui.tsx` to show Core Space-specific guidance about blind signing or data-display settings.
- Added `mode` prop to `DeployPanel` and included Core Space deployment notes referencing `SIGN_TX` APDU flow and device settings.
- Fixed missing trailing newlines in `package.json` and `tsconfig.json`.



## 2026-05-04

### Changed

- Updated projects/examples files: projects/examples/apps/hardware-wallet-showcase/index.html, projects/examples/apps/hardware-wallet-showcase/moon.yml, projects/examples/apps/hardware-wallet-showcase/package.json, projects/examples/apps/hardware-wallet-showcase/src/App.test.ts, projects/examples/apps/hardware-wallet-showcase/src/App.tsx, projects/examples/apps/hardware-wallet-showcase/src/devnode-client.ts, projects/examples/apps/hardware-wallet-showcase/src/ledger-session.ts, projects/examples/apps/hardware-wallet-showcase/src/main.tsx, projects/examples/apps/hardware-wallet-showcase/src/styles-base.css, projects/examples/apps/hardware-wallet-showcase/src/styles-components.css, projects/examples/apps/hardware-wallet-showcase/src/styles-deploy.css, projects/examples/apps/hardware-wallet-showcase/src/styles.css, and 10 more.

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

