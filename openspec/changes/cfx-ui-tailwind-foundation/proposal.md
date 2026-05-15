## Why

The repository now has enough UI surface area across CAS, examples, wallet flows, and future app work that repeating wallet, chain, modal, and form UI per app will create avoidable drift. A shared foundation is needed now because CAS already uses Tailwind while the reusable Conflux UI surfaces still mix inline styles, component CSS files, and app-specific presentation, making reuse and long-term maintenance inconsistent.

## What Changes

- **New**: Introduce a reusable shared UI foundation under `repos/cfx-ui/packages/` with a strict split between headless domain logic and Tailwind-styled default components.
- **New**: Define `@cfxdevkit/ui-core` as the style-free layer for wallet connection, dual-chain account state, chain switching, SIWE flows, and other reusable web3 UI controllers.
- **New**: Define `@cfxdevkit/ui` as the Tailwind-only component layer that composes `ui-core` with sane default styling, light/dark support, and app-level override points.
- **New**: Establish an app-level composition model where `projects/examples/packages/showcase-ui` remains showcase-specific and consumes the shared foundation instead of acting as the foundation itself.
- **New**: Add explicit documentation requirements for package boundaries, styling rules, override patterns, migration guidance, and contribution guardrails so future additions do not reintroduce mixed styling systems.
- **BREAKING**: New shared UI work SHALL stop introducing component-local CSS files or inline style objects in reusable UI packages; Tailwind becomes the single styling authoring method for new shared UI components.

## Capabilities

### New Capabilities
- `ui-core-foundation`: Defines the style-free reusable UI logic layer for wallet, chain, SIWE, and related domain-aware UI controllers.
- `ui-tailwind-primitives`: Defines the Tailwind-only reusable component layer with sane defaults, override hooks, and accessible primitives.
- `ui-foundation-documentation`: Defines the required documentation and governance surface that explains architecture, customization, migration, and contribution rules for the shared UI foundation.

### Modified Capabilities

## Impact

- Affected packages: `repos/cfx-ui/packages/wallet-connect`, new `repos/cfx-ui/packages/ui-core`, new `repos/cfx-ui/packages/ui`, and app-level packages such as `projects/examples/packages/showcase-ui`
- Affected apps: `projects/cas/apps/frontend`, `projects/examples/apps/showcase-public`, `projects/examples/apps/showcase-local`, and future UI-heavy projects such as DEX UI
- Affected dependencies: Tailwind becomes the single styling authoring surface for new shared UI work; Headless UI is available for generic accessibility primitives where it reduces maintenance cost
- Affected documentation: implementation docs, usage docs, migration guides, and contribution guardrails will be required as part of the delivered foundation