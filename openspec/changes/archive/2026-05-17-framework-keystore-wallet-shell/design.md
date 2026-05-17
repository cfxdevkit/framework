## Context

The dual-chain derivation correction completed the underlying account model in the backend and shared client. `@cfxdevkit/client` now exposes wallet and account summaries with explicit per-space fields: `accountType`, `espaceAddress`, `coreAddress`, `espaceDerivationPath`, and `coreDerivationPath`. However, showcase-local still owns the keystore experience through app-local panel code and `useShowcaseWorkspaceKeystoreRuntime`, which mixes keystore lifecycle, wallet/account state, devnode status, faucet logic, and node profile concerns in one hook.

At the same time, `@cfxdevkit/react` already exists as a headless package for reusable client and signer hooks, but it has no keystore surface. The result is that the framework has the right backend semantics but no reusable React contract for the keystore flows users actually touch first: create or unlock the keystore, choose a wallet root, choose the active derived account, and carry that selected identity into the rest of the runtime.

The keystore UX goals are also now constrained by the corrected Conflux dual-chain model: one selected account index yields one paired identity with `espaceAddress` and `coreAddress`, plus separate derivation paths. The React surface and the UI shell must make that pairing explicit and must not regress to an Ethereum-first single-address abstraction.

## Goals / Non-Goals

**Goals:**
- Add a reusable keystore provider and hook surface to `@cfxdevkit/react`.
- Keep keystore lifecycle and selection logic network-agnostic and backed by `@cfxdevkit/client` semantics.
- Represent the selected account as a dual-chain identity using the current shared-client field names.
- Add a reusable, headless wallet shell with separate blank/locked entry surfaces, a persistent identity strip, and wallet/account dropdown switchers.
- Refactor showcase-local to consume the reusable surface and retain only styling, composition, and app-specific side effects.

**Non-Goals:**
- Change backend keystore semantics or invent a new keystore transport separate from `@cfxdevkit/client`.
- Couple the keystore hooks to devnode lifecycle, network selection, or public/local mode.
- Require a portfolio implementation before the base keystore lifecycle and selection experience is reusable.
- Redesign every showcase-local workspace pane in this change.
- Add browser-wallet provider integration (MetaMask, Fluent, Ledger, or similar) in this change.

## Decisions

### Decision: Expose keystore behavior under a dedicated `@cfxdevkit/react/keystore` surface
The implementation SHALL add a dedicated keystore subpath and module tree inside `repos/cfx-ui/packages/react` rather than flatten keystore hooks into the existing generic root exports.

Rationale:
- The current React package is organized around focused surfaces (`account`, `balance`, `contract`, `tx`).
- Keystore lifecycle and wallet/account control are a different concern than chain/client data hooks.
- A dedicated surface makes it easier for showcase-local and future framework consumers to import only the control-plane pieces they need.

Alternatives considered:
- Re-export keystore hooks only from the root index: rejected because it blurs the boundary between chain interaction hooks and backend keystore control-plane hooks.
- Leave the logic in showcase-local: rejected because the user explicitly wants framework-owned reusable hooks and components.

### Decision: Build a focused keystore provider over the shared client, not over app-local runtime state
The keystore hooks SHALL consume a prebuilt shared client surface that exposes the `keystore` namespace, and SHALL not depend on showcase-local runtime hooks or app-local fetch wrappers.

Rationale:
- `@cfxdevkit/client` is already the canonical low-level contract for keystore lifecycle, wallet lists, active wallet, and derived accounts.
- The React package should not own transport creation or base URL concerns.
- This keeps the package testable and aligned with the existing provider pattern: the app constructs the client, the package distributes reusable behavior.

Alternatives considered:
- Have the React package instantiate its own HTTP client from a base URL: rejected because it hides transport ownership and makes SSR/tests worse.
- Bind the hooks directly to showcase-local fetch helpers: rejected because it would make the supposedly reusable surface app-specific on day one.

### Decision: Normalize the selected account as a dual-chain identity
The reusable hook surface SHALL treat the selected account as one derived wallet identity with paired fields: `espaceAddress`, `coreAddress`, `espaceDerivationPath`, `coreDerivationPath`, plus wallet-root metadata such as `id`, `name`, `accountType`, and `activeAccountIndex`.

Rationale:
- The dual-chain derivation fix established that Core and eSpace are independently derived but jointly selected for one account index.
- Consumers need one stable object to render the current signer identity and to pass into adjacent UI such as deploy, session-key, or portfolio views.
- Explicit dual-chain fields avoid regressing to the old ambiguous `address` and `coreAddress?` model.

Alternatives considered:
- Keep separate active-wallet and active-account models without a normalized identity object: rejected because every consumer would have to recombine the same fields differently.
- Collapse the identity to a single preferred address: rejected because it hides the corrected Conflux model.

### Decision: Separate wallet-root switching from derived-account switching
The wallet shell SHALL model mnemonic wallet selection and derived-account selection as separate controls with separate dropdown overlays.

Rationale:
- A wallet root and an account index are not the same choice.
- Browser-wallet mental models already distinguish changing the account from changing the wallet source or import.
- This separation maps directly to the backend data model and prevents the UI from hiding which level of state changed.

Alternatives considered:
- Use one combined selector: rejected because it obscures the boundary between wallet roots and derived accounts.
- Keep permanently visible wallet and account lists: rejected because it recreates the current flat and dispersive panel problem.

### Decision: Use a persistent identity strip as the shell anchor
When unlocked, the wallet shell SHALL render a persistent identity strip that keeps the selected wallet and selected dual-chain account visible while the rest of the keystore content changes.

Rationale:
- The current showcase-local panel is a vertical stack with no stable wallet home.
- A persistent header is the part of browser-wallet UX that most directly reduces user disorientation.
- It gives other flows a consistent place to read the current signer identity.

Alternatives considered:
- Keep the active wallet as one card inside the scrollable content: rejected because it makes the primary identity feel incidental.
- Move all details into dropdown overlays: rejected because users still need a continuous visible confirmation of the selected signer.

### Decision: Keep portfolio support optional in v1
The wallet shell SHALL provide an optional portfolio slot or extension point, but the base keystore hook and shell work SHALL NOT depend on portfolio or balance aggregation being completed.

Rationale:
- Portfolio was identified as an extra goal, not the prerequisite for fixing the keystore lifecycle and selection UX.
- Local, testnet, and mainnet balance strategies differ and would expand scope.
- A slot-based design keeps the shell reusable while allowing showcase-local to add balances later.

Alternatives considered:
- Block the shell work on a full portfolio implementation: rejected because it delays the core reusable keystore surface.
- Omit portfolio extensibility entirely: rejected because the shell should be able to host it cleanly once available.

### Decision: Showcase-local becomes the proving ground, not the owner
Showcase-local SHALL adopt the reusable hooks and components and retain only theme, layout, and app-specific side effects such as devnode or faucet coordination.

Rationale:
- The framework package must become the source of truth for keystore lifecycle behavior.
- The current `useShowcaseWorkspaceKeystoreRuntime` is too broad to serve as a reusable foundation.
- Using showcase-local as the first consumer gives a realistic test bed without leaving the logic buried in the example app.

Alternatives considered:
- Leave showcase-local fully custom and only duplicate the ideas in `@cfxdevkit/react`: rejected because semantic drift would return immediately.

## Risks / Trade-offs

- [The new hooks mirror showcase-local too closely] -> Keep the provider and hook surface bound to shared-client keystore semantics, not to showcase-local panel structure.
- [Headless dropdown switchers become awkward to adopt] -> Keep the shell primitives small and state-driven, with consumers owning styling and composition.
- [Portfolio pressure pulls network and devnode concerns back into the keystore package] -> Restrict v1 to an optional slot and defer balance aggregation to follow-up work.
- [Showcase-local still leaks app-specific logic into the reusable layer] -> Keep devnode, faucet, network, and workspace orchestration outside the keystore module boundary.
- [Consumers misuse the selected identity as a single-address wallet] -> Normalize and document the dual-chain identity object everywhere the hooks expose selected-account state.

## Migration Plan

1. Add a dedicated keystore module surface in `repos/cfx-ui/packages/react`, including exports, context/provider, and hook primitives backed by `@cfxdevkit/client`.
2. Add headless wallet-shell components that consume the new hooks and expose blank, locked, unlocked, and active-wallet UI states plus wallet and account switchers.
3. Refactor showcase-local keystore UI to compose the reusable shell and keep only showcase-local-specific styling and adjacent runtime coordination.
4. Update React package documentation and showcase-local usage guidance to describe the dual-chain identity model and the intended consumer boundary.
5. Validate lint, typecheck, tests, and a manual keystore flow in showcase-local across blank, locked, unlocked, and active-wallet states.

## Open Questions

- Whether the keystore surface should export only a dedicated `./keystore` entrypoint or also re-export selected primitives from the root `@cfxdevkit/react` index.
- Whether account display names should remain consumer-generated (`Account #2`) or gain a reusable labeling helper in the package.
- Whether the first portfolio-capable follow-up should live in the keystore module or in a separate wallet or portfolio module once balance sources are clearer.
