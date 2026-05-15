## Context

The repository currently has three different UI authoring models in active use: Tailwind in CAS, component CSS files in `projects/examples/packages/showcase-ui`, and inline style objects in reusable web3 surfaces such as `@cfxdevkit/wallet-connect/ui`. This makes the most reusable UI flows, such as wallet connection, chain switching, modal presentation, and status surfaces, harder to share across apps without copying or restyling them per project.

The proposed foundation introduces a clearer layering model for reusable UI in `repos/cfx-ui/packages/`:

```text
apps → app-level wrappers → @cfxdevkit/ui → @cfxdevkit/ui-core → framework/domain packages
```

The intent is not to make `showcase-ui` the universal component system. Instead, `showcase-ui` becomes an app-specific composition layer built on top of a common reusable foundation that CAS, showcase apps, and future UI-heavy projects can share.

## Goals / Non-Goals

**Goals:**
- Create a reusable UI architecture with a strict separation between style-free behavior and Tailwind-styled defaults
- Standardize on Tailwind as the single styling authoring method for new shared UI components
- Reuse generic accessibility behavior through Headless UI where it reduces maintenance cost
- Make web3-specific UI flows reusable without forcing app projects into a single visual identity
- Define a stable app-level override model so projects can style shared components as native to their product
- Require clear architecture, usage, migration, and contribution documentation to prevent future styling and package-boundary drift

**Non-Goals:**
- Rebuilding every existing app-level UI component during the first implementation pass
- Eliminating `@cfxdevkit/wallet-connect` or `@cfxdevkit/theme` immediately
- Creating a second styling system on top of Tailwind through large theme-object APIs
- Solving every project-specific branding need inside the shared packages

## Decisions

### 1. Split the foundation into `ui-core` and `ui`
**Decision:** Create `@cfxdevkit/ui-core` for headless, style-free UI logic and `@cfxdevkit/ui` for Tailwind-only styled primitives and domain components.

**Rationale:** The main source of drift is the current coupling of interaction logic and presentation. A package split makes the boundary explicit: `ui-core` owns behavior, while `ui` owns default presentation.

**Alternatives considered:**
- Put both behavior and styling into a single shared package: rejected because it recreates the current coupling problem under a new name.
- Let each app wrap `wallet-connect` directly and skip a shared UI foundation: rejected because reusable web3 flows would continue to fork per app.

### 2. Tailwind is the only new styling authoring surface in shared UI
**Decision:** New reusable UI components in shared packages MUST be authored with Tailwind classes only. New component-local CSS files and inline style objects are disallowed in shared UI packages.

**Rationale:** The repository already has Tailwind in CAS, and the user-facing ergonomics of Tailwind are easier to teach, override, and audit than a bespoke token-plus-CSS authoring model.

**Alternatives considered:**
- Keep mixing CSS files, tokens, and inline style objects: rejected because it continues the current inconsistency.
- Keep CSS variables as the primary authoring model: rejected because it forces consumers to learn a project-specific styling layer instead of using the Tailwind system already present in the repo.

### 3. Headless UI is for generic accessibility primitives, not for domain behavior ownership
**Decision:** Headless UI may be used inside `@cfxdevkit/ui` for generic primitives such as dialog, menu, popover, tabs, listbox, combobox, and disclosure. Web3-specific flows such as wallet connect, chain switching, dual-chain account state, and SIWE SHALL remain owned by `ui-core` and composed into styled components by `ui`.

**Rationale:** Headless UI solves accessibility mechanics well, but it does not model Conflux-specific or dual-chain workflows. Those domain behaviors remain the differentiating reusable value of the framework.

**Alternatives considered:**
- Use Headless UI as the main abstraction for all reusable UI: rejected because it does not solve the domain-specific controller layer.
- Avoid Headless UI entirely: rejected because it would reintroduce avoidable accessibility maintenance for generic primitives.

### 4. App-level customization happens through class and slot override contracts
**Decision:** Shared styled components expose customization through `className`, slot-level class overrides, and wrapper composition. App projects remain free to create local wrappers such as `showcase-ui` that pin house defaults.

**Rationale:** This gives app teams a low-friction way to match product styling without rebuilding behavior-heavy components. It also avoids introducing a second configuration DSL for theming.

**Alternatives considered:**
- Theme-object-only customization: rejected because it tends to become a parallel styling system.
- Full copy-paste customization per app: rejected because behavior-heavy components would diverge quickly.

### 5. Documentation is part of the implementation contract
**Decision:** The final implementation SHALL include package-level usage docs, architecture and boundary docs, migration guidance for current consumers, and contribution rules for adding components without reintroducing styling drift.

**Rationale:** The foundation only stays coherent if future contributors can quickly understand where logic belongs, how to override styling, and what patterns are disallowed.

**Alternatives considered:**
- Leave documentation as follow-up cleanup: rejected because drift begins immediately when package boundaries are unclear.

## Candidate Extraction Matrix

The first implementation pass should not discover reusable boundaries ad hoc. It should work from a candidate extraction matrix built from the current CAS frontend and DEX UI surfaces.

| Domain | Candidate shared exports | Current source areas | Target package | Reusable now | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Wallet session | `useWalletSession`, `WalletButton`, `WalletStatusChip` | CAS `auth-context`, CAS `WalletConnect`, DEX `NavBar` wallet surface | `ui-core` + `ui` | Yes | P1 | Shared wallet connect, disconnect, signed/unsigned state, and address presentation |
| Network switching | `useNetworkSwitchController`, `NetworkSwitchNotice` | CAS `useNetworkSwitch`, DEX wrong-chain handling in `NavBar`, `Swap`, `AddLiquidity`, `Pools` | `ui-core` + `ui` | Yes | P1 | Common wrong-network detection and switch action; app copy remains overridable |
| Token registry | `useTokenRegistry`, `resolveTokenAddress`, `normalizeAddress`, `wcfxAddress` | DEX `knownTokens`, DEX `useDex`, CAS `usePoolTokens` | `ui-core` | Yes | P1 | Consolidates native-token normalization, metadata, icons, and address rules |
| Token selection | `getPairedTokens`, `useSelectableTokens`, `TokenSelect`, `TokenAmountField`, `TokenPairSelector` | CAS `usePoolTokens`, CAS `StrategyBuilder`, DEX `Swap`, DEX `AddLiquidity` | `ui-core` + `ui` | Yes | P1 | Shared token picker behavior with app-level visual overrides |
| Portfolio balances | `useTokenBalances`, `usePortfolioTokens`, `PortfolioTable`, `TokenBalanceList` | DEX `TokenBalances`, CAS `usePoolTokens`, DEX `useDex` | `ui-core` + `ui` | Yes | P2 | Shared read-only token balance and portfolio display surface |
| Token pricing | `useTokenPrice`, `PriceSummary` | CAS `useTokenPrice`, DEX quote summary in `Swap` | `ui-core` + `ui` | Yes | P2 | Shared live pair price and USD enrichment where available |
| Swap quoting | `useSwapQuote`, `QuoteBreakdown` | DEX `Swap` quote path, route simulation, slippage logic | `ui-core` + `ui` | Yes | P2 | Keep router-specific contract reads in controllers; UI stays overridable |
| Approvals | `useApprovalController`, `ApprovalDialog` | CAS `ApprovalWidget`, DEX approval handling in `Swap` and `AddLiquidity` | `ui-core` + `ui` | Yes | P2 | Shared allowance checks, unlimited approval policy, revoke/set exact patterns |
| Native wrap or unwrap | `useWrapNativeController`, `WrapNativeDialog` | CAS `WcfxWrapModal`, DEX native asset branches in `Swap` and `AddLiquidity` | `ui-core` + `ui` | Yes | P2 | Shared CFX or wCFX flow with configurable labels and copy |
| Swap execution | `useSwapExecution`, `SwapPanel` | DEX `Swap` | `ui-core` + `ui` | Partially | P3 | Execution is reusable; route source and DEX-specific copy remain adapter-driven |
| Liquidity provision | `useLiquidityProvision`, `LiquidityPanel` | DEX `AddLiquidity` | `ui-core` + `ui` | Partially | P3 | Core approval and write flow is reusable; pair sourcing and pool defaults vary by app |
| LP positions | `useLiquidityRemoval`, `LiquidityPositions` | DEX `Pools` | `ui-core` + `ui` | Partially | P3 | Reusable for AMM-style apps, not necessarily all consumers |
| Transaction stepper | `TransactionStepper` | CAS `StrategyBuilder` transaction step state | `ui` | Yes | P3 | Generic progress UI that can be reused across wrap, approval, swap, and strategy flows |

### App-level-only candidates

The following surfaces are intentionally not part of the first shared foundation and should remain app-level wrappers or screens:

- CAS strategy-builder form composition and job-specific business rules
- DEX local contract discovery, token icon upload, and pool import admin tools
- App navigation shells, dashboards, analytics cards, and project-specific copy blocks

### Suggested extraction waves

1. **Wave 1:** wallet session, network switching, token registry, token selection
2. **Wave 2:** portfolio balances, token pricing, approvals, native wrap or unwrap
3. **Wave 3:** swap execution, liquidity provision, LP positions, transaction stepper

This wave ordering minimizes rework because later trade and strategy surfaces depend on the earlier wallet, token, and approval primitives.

## Risks / Trade-offs

- **Boundary confusion between `wallet-connect` and `ui-core`** → Mitigation: define a clear import policy and migration plan that allows `ui-core` to compose existing wallet behavior first, then absorb or narrow exports only where necessary.
- **Tailwind-only policy may feel restrictive for one-off needs** → Mitigation: keep app-level wrappers as the sanctioned escape hatch instead of loosening shared-package rules.
- **Headless UI introduces another dependency and abstraction** → Mitigation: use it only for generic accessibility primitives where it clearly reduces maintenance burden.
- **Documentation can become stale after the initial build** → Mitigation: require documentation updates as part of the component-addition workflow and contribution checklist.
- **Migration churn for existing showcase and wallet UI** → Mitigation: migrate high-value domains first, especially wallet and chain surfaces, before broader presentational primitives.

## Migration Plan

1. Create `@cfxdevkit/ui-core` with style-free controller APIs for the first reusable domain slice, starting with wallet and chain flows.
2. Create `@cfxdevkit/ui` with Tailwind-only default components that consume `ui-core` and, where useful, Headless UI primitives.
3. Move or wrap existing reusable wallet UI in `wallet-connect` behind the new foundation surface without forcing all app-level UI to migrate at once.
4. Update `projects/examples/packages/showcase-ui` to become a showcase-specific wrapper over `@cfxdevkit/ui` instead of a stand-alone foundation.
5. Pilot the shared foundation in CAS and showcase flows before expanding into broader primitive coverage.
6. Ship architecture, usage, migration, and contribution documentation alongside the first implementation slice.

## Open Questions

- Whether the existing `@cfxdevkit/theme` package should evolve into a Tailwind preset/token source or remain as compatibility infrastructure during migration
- How much of the current `wallet-connect` public surface should be preserved as-is versus re-exported through the new foundation packages
- Whether a shared `cas-ui` or similar app-level package is needed immediately or only after the common foundation proves stable in two consumers