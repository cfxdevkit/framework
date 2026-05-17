## ADDED Requirements

### Requirement: ui-core provides style-free reusable UI behavior
The shared UI foundation SHALL provide a package named `@cfxdevkit/ui-core` under `repos/cfx-ui/packages/ui-core/`. This package SHALL contain reusable UI behavior for domain-aware flows without shipping presentation-specific styling.

#### Scenario: ui-core package exists
- **WHEN** `repos/cfx-ui/packages/ui-core/package.json` is read
- **THEN** `name` is `@cfxdevkit/ui-core`

#### Scenario: ui-core has no shared styling assets
- **WHEN** the files under `repos/cfx-ui/packages/ui-core/src/` are inspected
- **THEN** the package contains no component-local CSS files and no Tailwind-authored styled component layer

### Requirement: ui-core owns reusable domain controllers for web3 UI flows
`@cfxdevkit/ui-core` SHALL expose style-free controller APIs for reusable web3 UI flows, including wallet connection, dual-chain account state, chain switching, and SIWE-oriented interaction flows.

#### Scenario: wallet and chain domain controllers are exported
- **WHEN** `repos/cfx-ui/packages/ui-core/src/index.ts` is read
- **THEN** it exports controller APIs for wallet and chain-related reusable UI behavior

#### Scenario: SIWE flow behavior is exported without presentation coupling
- **WHEN** `repos/cfx-ui/packages/ui-core/src/index.ts` is read
- **THEN** it exports reusable SIWE-oriented interaction APIs without requiring styled component imports

### Requirement: ui-core composes framework domain packages instead of app packages
`@cfxdevkit/ui-core` SHALL depend only on lower-level framework and domain packages, and SHALL NOT depend on app-level packages such as showcase-specific UI wrappers.

#### Scenario: ui-core avoids app-level package dependencies
- **WHEN** `repos/cfx-ui/packages/ui-core/package.json` is read
- **THEN** its dependencies and peer dependencies do not include `@cfxdevkit/example-showcase-ui` or other app-level UI packages

#### Scenario: ui-core composes framework packages
- **WHEN** `repos/cfx-ui/packages/ui-core/package.json` is read
- **THEN** it may depend on framework-level packages such as `@cfxdevkit/core`, `@cfxdevkit/react`, or `@cfxdevkit/wallet-connect`