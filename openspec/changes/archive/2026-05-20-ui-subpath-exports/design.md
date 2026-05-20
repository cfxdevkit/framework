## Context

`@cfxdevkit/ui` is built with `vite` in lib mode using a single entry `{ index: 'src/index.ts' }`. All 18 components are compiled into one `dist/index.js`. The dts plugin produces individual `.d.ts` files per source file but the exports map only exposes `.` so bundlers see a single opaque module and cannot eliminate unused components.

`@cfxdevkit/ui-core` is in the same position — three independent sub-modules (`network`, `tokens`, `wallet`) exposed only through a single `.` entry.

## Goals / Non-Goals

**Goals:**
- Add 6 sub-path exports to `@cfxdevkit/ui`: `./shell`, `./panel`, `./form`, `./data-display`, `./feedback`, `./wallet`
- Add 3 sub-path exports to `@cfxdevkit/ui-core`: `./network`, `./tokens`, `./wallet`
- Keep the root `.` entry unchanged — no consumer code needs updating
- Enable bundlers to drop unused component groups from application bundles

**Non-Goals:**
- Splitting `@cfxdevkit/ui` or `@cfxdevkit/ui-core` into separate packages
- Changing any component API or removing any export from `.`
- Migrating existing consumers to the new sub-paths (optional, up to each team)

## Decisions

### D1: Multi-entry Vite lib build
Vite's lib mode accepts an `entry` object. Each key becomes a separate output file. Adding keys alongside the existing `index` key produces `dist/shell.js`, `dist/panel.js`, etc. with zero change to how `index.js` is built.

### D2: Barrel files in `src/` per group
Each sub-path gets its own `src/<group>.ts` file that re-exports only the components in that group. The root `src/index.ts` is unchanged and continues to re-export all barrels. This is the minimal-touch approach: no component files move.

Component-to-group mapping:
| `src/shell.ts` | `AppShell` |
| `src/panel.ts` | `Panel`, `AssetConversionPanel` |
| `src/form.ts` | `Field`, `TokenAmountField`, `TokenPairSelector`, `TokenSelect` |
| `src/data-display.ts` | `StatusGrid`, `Metric`, `SegmentedControl` |
| `src/feedback.ts` | `Notice`, `NetworkSwitchNotice` |
| `src/wallet.ts` | `WalletButton`, `WalletPickerModal`, `WalletProviderCard`, `WalletStatusChip`, `IconButton` |

### D3: ui-core uses the same pattern
`src/network.ts`, `src/tokens.ts`, `src/wallet.ts` already exist as separate modules (they are the actual implementations, not barrels). The Vite entry object and exports map just need to reference them directly.

### D4: `data-display` entry key slug
Vite uses entry keys as output filenames. `data-display` produces `dist/data-display.js` — this works as a package export sub-path (`"./data-display"`) without issues in Node.js or bundlers.

## Risks / Trade-offs

- **None for consumers** — purely additive, backward-compatible
- `dist/` will grow (6 additional `.js` + `.d.ts` files) but all are tiny barrels
- dts plugin with `entryRoot: 'src'` already generates per-file `.d.ts`; the additional entry files are picked up automatically
