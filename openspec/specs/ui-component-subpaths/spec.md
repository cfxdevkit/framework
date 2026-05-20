# ui-component-subpaths Specification

## Purpose
TBD - created by archiving change ui-subpath-exports. Update Purpose after archive.
## Requirements
### Requirement: @cfxdevkit/ui SHALL expose granular sub-path exports
`@cfxdevkit/ui` SHALL provide named sub-path exports for each component group so that bundlers can exclude unused groups from application bundles.

#### Scenario: Sub-path imports resolve to group-scoped modules
- **WHEN** a consumer imports `@cfxdevkit/ui/form`
- **THEN** only `Field`, `TokenAmountField`, `TokenPairSelector`, and `TokenSelect` are included in the resolved module
- **AND** `AppShell`, `Panel`, `WalletButton`, and other non-form components are NOT included

#### Scenario: Root import continues to include all components
- **WHEN** a consumer imports `@cfxdevkit/ui` (root `.` export)
- **THEN** all 18 components are available unchanged

#### Scenario: All six sub-paths resolve
- **WHEN** the exports map of `@cfxdevkit/ui` is inspected
- **THEN** `./shell`, `./panel`, `./form`, `./data-display`, `./feedback`, and `./wallet` SHALL each resolve to a built `.js` and `.d.ts` file

### Requirement: @cfxdevkit/ui-core SHALL expose sub-path exports for its three modules
`@cfxdevkit/ui-core` SHALL provide `./network`, `./tokens`, and `./wallet` sub-path exports corresponding to its existing module files.

#### Scenario: ui-core sub-paths resolve
- **WHEN** the exports map of `@cfxdevkit/ui-core` is inspected
- **THEN** `./network`, `./tokens`, and `./wallet` SHALL each resolve to a built `.js` and `.d.ts` file

