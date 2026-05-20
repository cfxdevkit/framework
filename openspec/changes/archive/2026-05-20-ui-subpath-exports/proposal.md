## Why

`@cfxdevkit/ui` ships 18 components in a single `index.js` bundle. Every consumer — CAS, showcase-local, showcase-public — pulls the entire bundle regardless of which components it actually uses. CAS needs `Field`, `Panel`, `Notice`, `Metric` and nothing from `AppShell` or the wallet picker stack; today it gets all of them. Adding granular sub-path exports is a zero-breaking-change additive improvement that unlocks tree-shaking at the component-group boundary.

## What Changes

- `vite.config.ts` in `@cfxdevkit/ui` updated from a single-entry build to a multi-entry build with one entry per sub-path group.
- `package.json` exports map extended with `./shell`, `./panel`, `./form`, `./data-display`, `./feedback`, `./wallet` sub-paths alongside the existing `.` root entry (which continues to re-export everything for consumers that import the whole package).
- `src/` gains one barrel file per sub-path group (`shell.ts`, `panel.ts`, `form.ts`, `data-display.ts`, `feedback.ts`, `wallet.ts`).
- `@cfxdevkit/ui-core` receives the same treatment: `./network`, `./tokens`, `./wallet` sub-paths added.

Component grouping:
| Sub-path | Components |
|----------|-----------|
| `./shell` | `AppShell` |
| `./panel` | `Panel`, `AssetConversionPanel` |
| `./form` | `Field`, `TokenAmountField`, `TokenPairSelector`, `TokenSelect` |
| `./data-display` | `StatusGrid`, `Metric`, `SegmentedControl` |
| `./feedback` | `Notice`, `NetworkSwitchNotice` |
| `./wallet` | `WalletButton`, `WalletPickerModal`, `WalletProviderCard`, `WalletStatusChip`, `IconButton` |

## Capabilities

### New Capabilities
- `ui-component-subpaths`: `@cfxdevkit/ui` and `@cfxdevkit/ui-core` expose granular sub-path exports so bundlers can tree-shake at group boundaries without any consumer code changes.

### Modified Capabilities

## Impact

- `repos/cfx-ui/packages/ui/` — vite.config.ts, package.json, src/ (new barrel files)
- `repos/cfx-ui/packages/ui-core/` — package.json, vite.config.ts (if multi-entry needed)
- No consumer import changes required — the root `.` export continues to work
