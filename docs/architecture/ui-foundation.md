# UI Foundation

This document defines the implementation boundary for the Conflux reusable UI foundation introduced by the `cfx-ui-tailwind-foundation` change.

## Dependency direction

```text
apps
  -> app-level wrappers
  -> @cfxdevkit/ui
  -> @cfxdevkit/ui-core
  -> framework and domain packages
```

## Responsibilities

| Layer | Owns | Must not own |
| --- | --- | --- |
| `@cfxdevkit/ui-core` | wallet, network, and token-selection controllers; pure token helpers | styling, app copy, app package imports |
| `@cfxdevkit/ui` | Tailwind-only reusable web3 UI and generic primitives | app-specific orchestration, inline styles, component CSS files |
| app-level wrappers | product copy, auth-specific flows, layout composition, app-specific visual language | reusable controller logic duplicated from `ui-core` |

## Design token strategy

- `@cfxdevkit/ui` no longer documents or depends on an app-facing `--cfx-color-*` token catalog.
- Shared components are authored with Tailwind utility classes and expect the consuming app to provide any brand-level theme values through Tailwind configuration or `@theme` blocks.
- Legacy theme CSS variables may still exist in older apps, but they are not the contract for the shared UI foundation.
- When documenting customization, prefer `@theme`, app wrappers, and `className` overrides over raw CSS-variable lookup tables.

## Migration guidance

- `showcase-ui`: act as a wrapper and re-export layer over `@cfxdevkit/ui` instead of becoming the shared foundation.
- CAS: consume `@cfxdevkit/ui` directly for reusable wallet status and token-selection surfaces, while keeping auth-specific actions local.
- Existing wallet selection UI: keep `@cfxdevkit/wallet-connect/ui` for wallet picker flows until a generic replacement is justified.

## Long-term boundary with `@cfxdevkit/wallet-connect/ui`

- Keep connector discovery and wallet picker flows in `@cfxdevkit/wallet-connect/ui` until they can be generalized without app-specific assumptions.
- Move reusable status, network warning, and token-input surfaces into `@cfxdevkit/ui`.
- Avoid duplicating wallet session logic in both packages; controllers belong in `@cfxdevkit/ui-core`.

## Contribution rules

- Do not add component-local CSS files to `@cfxdevkit/ui`.
- Do not add inline style objects to `@cfxdevkit/ui` or `@cfxdevkit/ui-core`.
- Do not move app-specific auth, modal choreography, or product copy into shared packages.
- Every new shared surface must update this document or the package readmes with ownership, usage, and migration notes.
- If a surface cannot clearly fit the matrix below, keep it app-level until the ownership case is explicit.

## Extraction matrix

| Surface | Shared owner | Current source | Notes |
| --- | --- | --- | --- |
| Wallet session | `@cfxdevkit/ui-core` | wallet-connect hooks and app wallet controls | shared controller, no styling |
| Network switching | `@cfxdevkit/ui-core` + `@cfxdevkit/ui` | CAS network switch helper | headless controller plus styled notice |
| Token registry | `@cfxdevkit/ui-core` | DeFi and CAS token sources | normalized helpers only |
| Token selection | `@cfxdevkit/ui-core` + `@cfxdevkit/ui` | CAS strategy builder and showcase token pickers | shared controller plus styled selects |
| Field shell | `@cfxdevkit/ui` | CAS and `defi-react` form wrappers | shared labelled input shell; validation stays app-level |
| Notice banner | `@cfxdevkit/ui` | CAS notices and `defi-react` widgets | shared alert/status shell with app-owned copy |
| Status grid + metric | `@cfxdevkit/ui` | CAS status pages and `defi-react` primitives | reusable KPI/status layout for dashboards and safety pages |
| Wallet status chip | `@cfxdevkit/ui` | CAS wallet widget | styled reusable wallet state surface |
| Wallet picker modal | app-level for now | `@cfxdevkit/wallet-connect/ui` | keep separate until generalized |
| Auth sign-in CTA | app-level | CAS wallet widget | tied to app auth flow |
| Modal shell | candidate for `@cfxdevkit/ui` | CAS approvals modal, older showcase dialogs | extract after shared focus management and animation API are defined |
| Approvals | app-level for now | CAS approvals modal | revisit after broader extraction work |
| Swap and liquidity builders | app-level for now | DeFi and CAS strategy surfaces | wait for broader domain extraction |

## Validation status

- `@cfxdevkit/ui-core` typechecks cleanly.
- `@cfxdevkit/ui` typechecks cleanly.
- `showcase-ui` consumes the foundation as a wrapper layer.
- CAS pilots the shared foundation on wallet status, token-selection, form-shell, and status-surface primitives.