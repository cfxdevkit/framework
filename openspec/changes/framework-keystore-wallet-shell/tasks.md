## 1. React Keystore Provider And Hooks

- [x] 1.1 Add a dedicated keystore module and export surface in `repos/cfx-ui/packages/react/package.json`, `repos/cfx-ui/packages/react/src/index.ts`, and new `repos/cfx-ui/packages/react/src/keystore/` entry files.
- [x] 1.2 Add a keystore context and provider in `repos/cfx-ui/packages/react/src/keystore/` that consume a prebuilt shared client keystore surface instead of constructing app-local transport.
- [x] 1.3 Implement hook modules for lifecycle, wallet roots, derived accounts, and active dual-chain identity using the current `@cfxdevkit/client` fields (`accountType`, `espaceAddress`, `coreAddress`, `espaceDerivationPath`, `coreDerivationPath`).
- [x] 1.4 Add focused tests for blank, locked, unlocked, and active-wallet state normalization plus wallet and account mutation refresh behavior in `repos/cfx-ui/packages/react/src/`.

## 2. React Wallet Shell Components

- [x] 2.1 Add headless keystore shell primitives in `repos/cfx-ui/packages/react/src/keystore/` for the entry surfaces, persistent identity strip, wallet switcher overlay, and account switcher overlay.
- [x] 2.2 Ensure the shell keeps wallet-root switching and derived-account switching as separate controls and renders both eSpace and Core identity fields for the selected account.
- [x] 2.3 Add an optional portfolio slot or extension point to the shell without coupling the base components to balance fetching or network-specific portfolio logic.
- [x] 2.4 Add component-level tests covering distinct blank versus locked surfaces, persistent identity rendering, and dropdown-switcher behavior.

## 3. Showcase-Local Adoption

- [ ] 3.1 Refactor `projects/examples/apps/showcase-local/app/workspace/keystore/runtime.ts` and related workspace wiring so showcase-local consumes the reusable keystore hooks for lifecycle, wallet, and account state.
- [ ] 3.2 Replace the current app-local keystore panel composition in `projects/examples/apps/showcase-local/app/panels/keystore/` with themed wrappers around the reusable wallet shell components.
- [ ] 3.3 Remove the always-visible wallet and account management lists from showcase-local and route wallet/account switching through dropdown overlays anchored to the persistent identity strip.
- [ ] 3.4 Verify showcase-local presents the current dual-chain model without redefining alternate field names or collapsing the selected account to a single-address abstraction.

## 4. Documentation And Validation

- [ ] 4.1 Update `repos/cfx-ui/packages/react/README.md`, `repos/cfx-ui/packages/react/API.md`, and `repos/cfx-ui/packages/react/STRUCTURE.md` to describe the keystore exports, hook contracts, wallet-shell components, and dual-chain identity model.
- [ ] 4.2 Run `pnpm --filter @cfxdevkit/react lint`, `pnpm --filter @cfxdevkit/react typecheck`, and `pnpm --filter @cfxdevkit/react test` after the package changes land.
- [ ] 4.3 Run `pnpm --filter @cfxdevkit/example-showcase-local lint`, `pnpm --filter @cfxdevkit/example-showcase-local typecheck`, and `pnpm --filter @cfxdevkit/example-showcase-local build` after showcase-local adopts the reusable shell.
- [ ] 4.4 Manually verify create keystore, unlock keystore, switch wallet root, and switch derived account in showcase-local, confirming the selected identity shows both `espaceAddress` and `coreAddress` with the correct derivation paths.
