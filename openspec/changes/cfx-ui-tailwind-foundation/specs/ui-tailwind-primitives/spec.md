## ADDED Requirements

### Requirement: ui provides Tailwind-only reusable components
The shared UI foundation SHALL provide a package named `@cfxdevkit/ui` under `repos/cfx-ui/packages/ui/`. This package SHALL provide reusable styled components using Tailwind as the single styling authoring method for new shared UI work.

#### Scenario: ui package exists
- **WHEN** `repos/cfx-ui/packages/ui/package.json` is read
- **THEN** `name` is `@cfxdevkit/ui`

#### Scenario: shared styled components avoid mixed styling systems
- **WHEN** the files under `repos/cfx-ui/packages/ui/src/` are inspected
- **THEN** new reusable components do not rely on component-local CSS files or inline style objects for their default presentation

### Requirement: ui composes ui-core and exposes app-level customization hooks
`@cfxdevkit/ui` SHALL compose `@cfxdevkit/ui-core` and SHALL expose component-level customization through root `className`, slot-level class overrides, or wrapper-friendly composition patterns.

#### Scenario: ui depends on ui-core
- **WHEN** `repos/cfx-ui/packages/ui/package.json` is read
- **THEN** it depends on `@cfxdevkit/ui-core`

#### Scenario: styled domain components expose override points
- **WHEN** a styled domain component such as a wallet picker, connect button, or chain switcher is read
- **THEN** it exposes app-level styling override points without requiring consumers to fork its behavior logic

### Requirement: ui may use Headless UI for generic accessible primitives
`@cfxdevkit/ui` MAY use Headless UI internally for generic accessible primitives such as dialogs, menus, tabs, popovers, disclosures, or comboboxes, but SHALL keep Conflux-specific workflow behavior in `ui-core`.

#### Scenario: generic primitive can use Headless UI internally
- **WHEN** a generic primitive such as a dialog or menu is implemented in `@cfxdevkit/ui`
- **THEN** it may depend on Headless UI for accessibility mechanics

#### Scenario: domain behavior is not delegated to Headless UI
- **WHEN** reusable wallet or SIWE interaction flows are inspected
- **THEN** their domain-specific controller logic lives in `@cfxdevkit/ui-core` rather than being modeled solely through Headless UI primitives

### Requirement: app-level wrapper packages remain first-class consumers
App-specific UI packages such as `projects/examples/packages/showcase-ui` SHALL consume `@cfxdevkit/ui` as wrappers and composition layers rather than acting as the shared foundation themselves.

#### Scenario: showcase-ui composes shared foundation
- **WHEN** `projects/examples/packages/showcase-ui/package.json` and its exports are read after migration
- **THEN** it consumes the shared UI foundation instead of duplicating the reusable wallet and primitive logic layer