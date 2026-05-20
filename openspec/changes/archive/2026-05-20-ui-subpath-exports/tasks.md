## 1. @cfxdevkit/ui barrel files

- [ ] 1.1 Create `repos/cfx-ui/packages/ui/src/shell.ts` — re-exports `AppShell`
- [ ] 1.2 Create `repos/cfx-ui/packages/ui/src/panel.ts` — re-exports `Panel`, `AssetConversionPanel`
- [ ] 1.3 Create `repos/cfx-ui/packages/ui/src/form.ts` — re-exports `Field`, `TokenAmountField`, `TokenPairSelector`, `TokenSelect`
- [ ] 1.4 Create `repos/cfx-ui/packages/ui/src/data-display.ts` — re-exports `StatusGrid`, `Metric`, `SegmentedControl`
- [ ] 1.5 Create `repos/cfx-ui/packages/ui/src/feedback.ts` — re-exports `Notice`, `NetworkSwitchNotice`
- [ ] 1.6 Create `repos/cfx-ui/packages/ui/src/wallet.ts` — re-exports `WalletButton`, `WalletPickerModal`, `WalletProviderCard`, `WalletStatusChip`, `IconButton`

## 2. @cfxdevkit/ui vite.config.ts and package.json

- [ ] 2.1 Update `repos/cfx-ui/packages/ui/vite.config.ts` — extend `lib.entry` from `{ index }` to include `shell`, `panel`, `form`, `data-display`, `feedback`, `wallet` keys
- [ ] 2.2 Update `repos/cfx-ui/packages/ui/package.json` — add `./shell`, `./panel`, `./form`, `./data-display`, `./feedback`, `./wallet` sub-path entries to the `exports` map

## 3. @cfxdevkit/ui-core sub-paths

- [ ] 3.1 Update `repos/cfx-ui/packages/ui-core/vite.config.ts` — add `network`, `tokens`, `wallet` entries alongside `index`
- [ ] 3.2 Update `repos/cfx-ui/packages/ui-core/package.json` — add `./network`, `./tokens`, `./wallet` sub-path entries to the `exports` map

## 4. Build and verify

- [ ] 4.1 Run `pnpm --filter @cfxdevkit/ui build` and confirm new sub-path `.js` and `.d.ts` files appear in `dist/`
- [ ] 4.2 Run `pnpm --filter @cfxdevkit/ui-core build` and confirm new sub-path files appear in `dist/`
- [ ] 4.3 Run `pnpm -w lint` to confirm no Biome violations
- [ ] 4.4 Run `pnpm -w typecheck` to confirm no type errors
