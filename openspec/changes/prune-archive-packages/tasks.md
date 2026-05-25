## P1 — Verify no live importers

- [x] **P1.1** Run: `grep -r "@cfxdevkit/cdk-ai\|@cfxdevkit/llm-tools" repos projects --include="*.ts" --include="package.json" --exclude-dir=archive --exclude-dir=node_modules`
  Confirm output is empty before proceeding.

## P2 — Delete archive packages

- [x] **P2.1** `rm -rf repos/cfx-tools/packages/archive/`
- [x] **P2.2** `rm -rf repos/cfx-tools/infra/archive/`
- [x] **P2.3** Run `pnpm install` to update the lockfile (workspace entries no longer resolve)

## Validate

- [x] **V.1** `ls repos/cfx-tools/packages/archive/` → "No such file or directory"
- [x] **V.2** `ls repos/cfx-tools/infra/archive/` → "No such file or directory"
- [x] **V.3** `pnpm install` completes without errors
- [x] **V.4** `pnpm run build` on the full repo completes without errors referencing cdk-ai or llm-tools
