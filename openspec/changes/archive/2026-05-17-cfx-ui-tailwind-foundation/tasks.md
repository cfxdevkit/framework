> Closure note (2026-05-17): Archive this change as materially complete. The foundation packages are live; the remaining unchecked items are optional/general review polish and are not being used as an active implementation queue.

## 1. Package foundation

- [x] 1.1 Create `repos/cfx-ui/packages/ui-core/` with package metadata, build scripts, typecheck, lint, and public exports
- [x] 1.2 Create `repos/cfx-ui/packages/ui/` with package metadata, build scripts, typecheck, lint, and public exports
- [x] 1.3 Register both packages in workspace and moon so they are first-class build, lint, and typecheck targets
- [x] 1.4 Add the required shared dependencies and peer dependencies for Tailwind-based reusable UI, including any Headless UI dependency used for generic primitives

## 2. Extraction matrix and ownership

- [x] 2.1 Convert the candidate extraction matrix into implementation issues or work items grouped by domain
- [x] 2.2 Confirm the ownership boundary for each candidate surface: shared in `ui-core`, shared in `ui`, or app-level only
- [x] 2.3 Define the initial public API slice for the Wave 1 domains: wallet session, network switching, token registry, and token selection
- [x] 2.4 Record the intended migration source for each Wave 1 surface so implementation can proceed without rediscovering source ownership

## 3. Headless controller layer

- [x] 3.1 Implement the first reusable wallet and chain controller slice in `ui-core` without shared styling assets
- [x] 3.2 Implement the first reusable token registry and token selection controller slice in `ui-core`
- [x] 3.3 Wire `ui-core` to lower-level framework packages without introducing app-level package dependencies
- [x] 3.4 Add tests for the controller behaviors and package-boundary expectations in `ui-core`

## 4. Tailwind component layer

- [x] 4.1 Define the initial `ui` component API for generic primitives and web3-facing styled components
- [x] 4.2 Implement the first Tailwind-only styled domain components on top of `ui-core`, starting with wallet and chain surfaces
- [ ] 4.3 Implement generic accessible primitives with Headless UI only where it reduces maintenance burden
- [x] 4.4 Add override surfaces for consumers through `className`, slot-level class overrides, or wrapper-friendly composition
- [x] 4.5 Add tests covering rendering, accessibility-critical behavior, and customization contracts in `ui`

## 5. Consumer migration pilots

- [x] 5.1 Update `projects/examples/packages/showcase-ui` to consume the new shared foundation as an app-level wrapper layer
- [x] 5.2 Migrate at least one showcase wallet or chain flow to the new foundation without reintroducing component CSS or inline style objects
- [x] 5.3 Pilot the shared foundation in CAS for at least one reusable wallet or network surface
- [x] 5.4 Pilot at least one token-selection or approval surface using the shared foundation to validate the extraction matrix beyond wallet UI
- [x] 5.5 Review any remaining overlap with `@cfxdevkit/wallet-connect/ui` and document the intended long-term boundary

## 6. Documentation and governance

- [x] 6.1 Add architecture documentation describing `ui-core`, `ui`, and app-level wrapper package responsibilities and dependency directions
- [x] 6.2 Add consumer-facing usage docs with installation, setup, default theming behavior, and customization examples
- [x] 6.3 Add migration guidance for current consumers such as `showcase-ui`, CAS, and existing reusable wallet or token UI surfaces
- [x] 6.4 Add contribution rules that forbid new mixed styling patterns in shared UI packages and require docs updates for every new shared surface
- [x] 6.5 Publish the finalized extraction matrix in the implementation documentation so new additions can map themselves against the established ownership model

## 7. Validation

- [x] 7.1 Verify lint, typecheck, and tests pass for `ui-core`, `ui`, and the first migrated consumers
- [x] 7.2 Verify the shared foundation can be consumed by both showcase and CAS without forcing a single app-specific visual style
- [ ] 7.3 Verify the implemented surfaces match the finalized extraction matrix and that app-level-only candidates were not prematurely moved into shared packages
- [ ] 7.4 Review the final implementation against the OpenSpec proposal, design, and specs before marking the change ready for apply/implementation follow-through