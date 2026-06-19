# DevKit Framework — Repository Automation Analysis

## 1. Repository Identity

| Attribute | Value |
|-----------|-------|
| **Name** | `@cfxdevkit/framework` |
| **Version** | `2.0.0` (monorepo root) |
| **Type** | Conflux DevKit monorepo — framework, platform, domains, projects |
| **Package Manager** | `pnpm@10.33.2` |
| **Runtime** | Node.js `≥24.15.0` |
| **Task Runner** | **moonrepo@2.2.5** (Rust, vendor-neutral) |
| **Linter** | **Biome@2.4.15** |
| **Testing** | Vitest@4.1.9, Vite@8, v8-plugin-dts |
| **Release** | Changesets@2.31.0 |
| **Unused deps** | Knip@6.17.1 |
| **Code Graph** | GitNexus@1.6.3 (framework index, 9599 symbols, 20634 relationships) |

---

## 2. Architecture — 5-Tier Model

```
┌──────────────────────────────────────────────────────────┐
│ projects/ cas, chainbrawler, conflux-phaser, electro    │ Tier 3 (Applications)
├──────────────────────────────────────────────────────────┤
│ repos/cfx-domain (game-engine, automation)              │ Tier 2 (Domains)
├──────────────────────────────────────────────────────────┤
│ repos/cfx-tools (mcp, scaffold, cli, vscode-ext, docs)  │ Tier 1 (Platform)
├──────────────────────────────────────────────────────────┤
│ repos/cfx-* (core, keys, ui, solidity)                  │ Tier 0 (Framework)
├──────────────────────────────────────────────────────────┤
│ repos/cfx-meta, repos/cfx-config                        │ Tier -1 (Cross-cutting)
└──────────────────────────────────────────────────────────┘
```

**Key constraint**: One-way dependency graph. Lower tiers cannot depend on upper tiers.

---

## 3. Physical Layout

```
workspaces/root/
├── package.json                    ← Root monorepo manifest (pnpm + moon)
├── pnpm-workspace.yaml             ← 8 workspace glob patterns
├── .moon/
│   ├── workspace.yml               ← 30 moon projects declared explicitly
│   └── toolchain.yml               ← Node 24.15.0 + pnpm 10.33.2
├── repos/                          ← Tier -1 through Tier 0 + Tier 2
│   ├── cfx-config/   packages/tsconfig, biome-config, moon-config
│   ├── cfx-meta/     packages/arch-rules
│   ├── cfx-core/     packages/cdk, protocol, executor, devnode, testing
│   ├── cfx-keys/     packages/services, signer-session, wallet
│   ├── cfx-ui/       packages/react, defi-react, theme, ui-core, ui, wallet-connect
│   ├── cfx-solidity/packages/abis, contracts
│   ├── cfx-tools/    packages/compiler, codegen-contracts, devnode-core,
│   │                    mcp-server, devnode-server, keystore-server, client,
│   │                    arch-check, cdk-repo-check, scaffold-cli, mcp-server,
│   │                    vscode-extension, docs-site, cli, devnode-server
│   └── cfx-domain/   packages/game-engine, automation
├── projects/                       ← Tier 3 (applications)
│   ├── cas/            apps/, packages/, .data/ (chain data), openspec/
│   ├── chainbrawler/
│   ├── conflux-phaser/
│   ├── electro/
│   └── examples/       apps/, packages/
├── .cfxdevkit/                     ← Internal tooling workspace
│   ├── devkit/                   ← "devkit workspace" (separate git repo)
│   ├── devkit-workspace/         ← Scaffold CLI, templates, Docker images
│   ├── devnode/                  ← Blockchain node config
│   └── deployments.json          ← Solidity deployment records
├── openspec/                       ← AI change management (spec-driven)
│   ├── config.yaml                 ← schema: spec-driven
│   ├── changes/                    ← Active + archived changes
│   └── specs/                      ← Main specs
├── .github/workflows/
│   ├── publish.yml                 ← npm publish with provenance
│   ├── build-docs-image.yml        ← Multi-arch Docker image build/push
│   └── (changesets/action)         ← Version packages
├── .github/dependabot.yml          ← Weekly npm + GitHub Actions updates
├── scripts/                        ← 7 automation scripts
├── docs/                           ← Documentation
├── infrastructure/                 ← Docker, compose, CI
└── .gitnexus/                      ← GitNexus code intelligence index
```

---

## 4. Existing Automation Stack

### moonrepo Tasks (per-project `moon.yml`)
- **30 projects** with explicit moon declarations
- Task types: `build`, `typecheck`, `test`, `lint`, `check`, `clean`
- Tasks use dependency declarations (`deps: [...]`) for parallel execution
- Task templates in `@cfxdevkit/moon-config` (library vs application)
- `inferTasksFromScripts: false` — tasks explicit, not auto-inferred

### CI/CD (GitHub Actions)
| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `publish.yml` | Release published / manual | `pnpm run build` → `moon run :check` → `node publish-packages.mjs` |
| `build-docs-image.yml` | Release / manual | Build docs site → multi-arch Docker push to GHCR |
| `changesets/action` | PR merge to main | Version packages + publish |

### Changesets
- Base branch: `main`
- Ignored packages: tsconfig, biome-config, moon-config, mcp-server, create, game-engine, automation
- Publish flow: `pnpm run build` → `moon run :check` → `node scripts/publish-packages.mjs`

### Scaffold CLI (`@cfxdevkit/scaffold-cli`)
- **Templates**: `minimal-dapp`, `project-example`, `wallet-probe`
- **Targets**: `devcontainer`, `code-server`
- **Commands**: `new`, `create`, `list-templates`, `list-targets`
- Packages: `scaffold-cli`, `template-core`, `ui-shared`, `conflux-wallet`, `vscode-extension`
- Docker images: `devkit-base`, `devkit-devcontainer`, `devkit-code-server`

### OpenSpec (AI Change Management)
- Schema: `spec-driven`
- 10+ archived changes (arch-rules, showcase cleanup, cdk-repo, llm-split, CAS porting, etc.)
- Provides: proposal, design, spec, tasks artifacts
- Integration: `/opsx:propose`, `/opsx:apply`, `/opsx:explore`, `/opsx:archive`

### GitNexus
- Framework index: 9599 symbols, 20634 relationships, 300 execution flows
- CLI: `gitnexus analyze`, `impact()`, `context()`, `detect_changes()`, `query()`
- Auto-must-run before any code edit

---

## 5. Key Scripts

| Script | Purpose |
|--------|---------|
| `scripts/publish-packages.mjs` | npm publish with provenance |
| `scripts/changeset-check.mjs` | Validate changeset status |
| `scripts/validate-repos.mjs` | Repository validation |
| `scripts/wire-package-dependencies.sh` | Link workspace dependencies |
| `scripts/scaffold-empty-packages.sh` | Create new package scaffolds |
| `scripts/showcase-dev.sh` | Start showcase apps |
| `scripts/fix-kebab-import-refs.mjs` | Fix kebab-case import violations |

---

## 6. pnpm Overrides (security hotspots)

```json
"overrides": {
  "@onekeyfe/hd-transport>protobufjs": "^7.5.8",
  "axios": "^1.15.0",
  "esbuild": ">=0.25.0",
  "ws": ">=8.21.0",
  "zod": "4.3.4"
}
```

---

## 7. Moonrepo → pidev Integration Points

### What moonrepo Already Does Well
- ✅ Deterministic task graph (parallel build, typecheck, test)
- ✅ Remote cache via S3-compatible buckets (no vendor lock-in)
- ✅ TypeScript toolchain sync
- ✅ Per-project layer declarations (library vs application)
- ✅ Task templates (`@cfxdevkit/moon-config`)

### What Can Be Added via pidev

| Area | Current State | pidev Enhancement |
|------|--------------|-------------------|
| **Package scaffolding** | `scaffold-cli` (basic) | AI-assisted template generation, target-aware scaffolding |
| **CI orchestration** | GH Actions (3 workflows) | pidev CI agents for auto-triggered PR reviews, auto-publish |
| **Code quality** | Biome + Knip + TypeScript | pidev lint agents, auto-fix pipelines, dead-code removal |
| **Release management** | Changesets + manual | pidev release agents for version bumping, changelog generation, multi-repo sync |
| **Documentation** | GitNexus + manual | pidev docs agents for auto-generating API docs, architecture diagrams |
| **Testing** | Vitest (unit) | pidev test agents for auto-test generation, flaky test detection |
| **Dependency management** | Dependabot + pnpm overrides | pidev dep agents for automated upgrading, override conflict resolution |
| **Code graph** | GitNexus (read-only) | pidev agents that use GitNexus for impact analysis before edits |
| **Project lifecycle** | Manual (arch-rules validation) | pidev agents for tier-compliance checks, architecture rule enforcement |

---

## 8. Recommended Automation Strategy

### Phase 1: Foundation (pidev + moonrepo)
1. **pidev CI agent** — replace manual `moon run :check` with pidev-orchestrated validation
2. **pidev publish agent** — auto-generate changelog entries, coordinate changesets
3. **pidev lint agent** — auto-fix Biome/Knip issues on PR

### Phase 2: Intelligence (pidev + GitNexus)
4. **pidev impact agent** — use GitNexus `impact()` pre-merge to predict breakage
5. **pidev refactor agent** — batch renames, imports, dead-code removal
6. **pidev test agent** — generate Vitest tests from function signatures

### Phase 3: Lifecycle (pidev + full stack)
7. **pidev scaffold agent** — AI-assisted `scaffold-cli` with template selection
8. **pidev docs agent** — auto-update architecture docs, generate API references
9. **pidev release agent** — multi-project versioning with cross-package dependency updates

---

## 9. Moonrepo Project Inventory (30 projects)

| Path | Package Name | Type |
|------|-------------|------|
| `repos/cfx-config/packages/tsconfig` | @cfxdevkit/tsconfig | configuration |
| `repos/cfx-config/packages/biome-config` | @cfxdevkit/biome-config | configuration |
| `repos/cfx-config/packages/moon-config` | @cfxdevkit/moon-config | configuration |
| `repos/cfx-meta/packages/arch-rules` | @cfxdevkit/arch-rules | configuration |
| `repos/cfx-core/packages/cdk` | @cfxdevkit/cdk | library |
| `repos/cfx-core/packages/protocol` | @cfxdevkit/protocol | library |
| `repos/cfx-core/packages/executor` | @cfxdevkit/executor | library |
| `repos/cfx-core/packages/devnode` | @cfxdevkit/devnode | library |
| `repos/cfx-core/packages/testing` | @cfxdevkit/testing | library |
| `repos/cfx-solidity/packages/abis` | @cfxdevkit/abis | library |
| `repos/cfx-solidity/packages/contracts` | @cfxdevkit/contracts | library |
| `repos/cfx-tools/packages/compiler` | @cfxdevkit/compiler | library |
| `repos/cfx-tools/packages/codegen-contracts` | @cfxdevkit/codegen-contracts | library |
| `repos/cfx-tools/packages/devnode-core` | @cfxdevkit/devnode-core | library |
| `repos/cfx-keys/packages/services` | @cfxdevkit/services | library |
| `repos/cfx-keys/packages/signer-session` | @cfxdevkit/signer-session | library |
| `repos/cfx-keys/packages/wallet` | @cfxdevkit/wallet | library |
| `repos/cfx-ui/packages/react` | @cfxdevkit/react | library |
| `repos/cfx-ui/packages/defi-react` | @cfxdevkit/defi-react | library |
| `repos/cfx-ui/packages/theme` | @cfxdevkit/theme | library |
| `repos/cfx-ui/packages/ui-core` | @cfxdevkit/ui-core | library |
| `repos/cfx-ui/packages/ui` | @cfxdevkit/ui | library |
| `repos/cfx-ui/packages/wallet-connect` | @cfxdevkit/wallet-connect | library |
| `repos/cfx-domain/packages/game-engine` | @cfxdevkit/game-engine | library |
| `repos/cfx-domain/packages/automation` | @cfxdevkit/automation | library |
| `repos/cfx-tools/packages/mcp-server` | @cfxdevkit/mcp-server | library |
| `repos/cfx-tools/packages/devnode-server` | @cfxdevkit/devnode-server | library |
| `repos/cfx-tools/packages/keystore-server` | @cfxdevkit/keystore-server | library |
| `repos/cfx-tools/packages/arch-check` | @cfxdevkit/arch-check | library |
| `repos/cfx-tools/packages/cdk-repo-check` | @cfxdevkit/cdk-repo-check | library |

Plus: `repos/cfx-tools/packages/scaffold-cli`, `vscode-extension`, `docs-site`, `cli`, `client`

---

## 10. OpenSpec Active Changes (archived: 10+)

| Change | Schema | Status |
|--------|--------|--------|
| `legacy-showcase-cleanup` | spec-driven | Archived |
| `arch-rules-foundation` | spec-driven | Archived |
| `change-3-arch-check` | spec-driven | Archived |
| `change-5-cfx-llm-split` | spec-driven | Archived |
| `cas-complete-porting` | spec-driven | Archived |
| ... | spec-driven | Archived |

---

## 11. Docker Image Pipeline

```
devkit-base:dev
  ↑
devkit-devcontainer:dev  ← includes VS Code extensions
devkit-code-server:dev   ← code-server variant
```

All images pushed to `ghcr.io/cfxdevkit/*` on release.

---

*Generated: 2026-06-19*
