# Migration Plan (Phase 2 → 4)

> Phase 1 only delivers this plan. Execution happens in later phases.

## Principles

1. **Move, don't rewrite.** Code is relocated with `git mv` to preserve history.
2. **Compat shims first.** Old import paths re-export from new locations until consumers update.
3. **One project at a time.** Never migrate two consumers in parallel.
4. **Green CI gate.** No migration step merges without passing the existing test suite of the affected package.

## Sequencing

| Step | What | Owner tier | Risk |
|------|------|------------|------|
| 1 | Lift `devkit/packages/*` → `framework/*`, keep npm names | Tier 0 | low (paths only) |
| 2 | Lift `devkit/devtools/*` → `platform/devtools/*` | Tier 1 | low |
| 3 | Lift devkit-workspace MCP/scaffold/vscode-ext/templates → `platform/*` | Tier 1 | medium (devcontainer paths) |
| 4 | Move `Electro/` under `projects/electro/`; rewire `@cfxdevkit/core` to workspace ref | Tier 3 | low |
| 5 | Move `conflux-phaser/` under `projects/conflux-phaser/` | Tier 3 | low |
| 6 | Move `chainbrawler/` under `projects/chainbrawler/`; identify candidates for `domains/game-engine/` | Tier 3 → 2 | medium |
| 7 | Move `cas/` under `projects/cas/`; identify candidates for `domains/automation/` and `framework/executor` | Tier 3 → 2 | high (live mainnet system) |
| 8 | Extract reusable bits into `domains/*` packages with their own tests | Tier 2 | medium |
| 9 | Replace duplicated client/contract code in projects with `framework/*` deps | Tier 3 | medium |
| 10 | Decommission old top-level folders | — | low (after green window) |

## Per-project migration checklist (template)

For each project under `projects/<name>/`:

- [ ] `git mv` source tree, preserve history
- [ ] Update `package.json` workspace ranges to new paths
- [ ] Replace in-tree blockchain client with `framework/core`
- [ ] Replace in-tree React/wallet code with `framework/react` + `framework/wallet-connect`
- [ ] Move contracts (if any) into `projects/<name>/contracts/`
- [ ] Move infra (Docker/K8s) into `infrastructure/<name>/`
- [ ] Update CI workflow path filters
- [ ] Smoke-test deploy on staging
- [ ] Update `docs/` references

## Rollback

Each step is a single squash-mergeable PR. Reverting the PR fully restores the prior state because:

- Old paths keep compat re-exports for one minor cycle.
- Lockfile + workspaces resolve identical artifacts before/after move.
- Infrastructure manifests pin image digests.
