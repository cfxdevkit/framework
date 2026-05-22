# Legacy Migration and Refactor Audit

Date: 2026-05-18

Scope: comparison of the current repository at `/workspaces/root` against the attached legacy codebases:

- `.cfxdevkit/devkit`
- `.cfxdevkit/devkit-workspace`

Purpose: provide a clear, verifiable billing and migration report covering improvements, updates, additions, and missing work after the merge/refactor into the current framework repository.

## Executive Summary

The current repository is not a direct copy of the previous codebases. It is a major reorganization and modernization that merges the old SDK-style `devkit` repository and the hackathon/product-focused `devkit-workspace` repository into a tiered workspace with clearer ownership, security boundaries, build orchestration, CI, and release controls.

The main completed improvements are:

- Dependency structure was reorganized from flatter legacy package groups into explicit technical slices under `repos/cfx-*` and deployable applications under `projects/*`.
- Build orchestration moved from the older Turbo/pnpm script mix to Moon + pnpm with a single root workflow.
- Security boundaries were formalized, especially around keys, keystores, MCP tools, CI secrets, and package publication.
- The local devnode experience was expanded into a shared Hono control-plane package used by apps, MCP, and the VS Code extension.
- The previous MCP, scaffold, editor, wallet, keystore, Solidity, UI, and CAS surfaces were either ported, split into cleaner packages, or converted into project/domain packages.
- New architecture, ADR, OpenSpec, LLM automation, CI/security, docs deployment, and release automation surfaces were added.

The main remaining work is:

- The legacy local DEX stack from `devkit-workspace` has not been fully ported as a runnable first-class stack. The current repository contains DeFi UI primitives and CAS Swappi adapter configuration, but not the old `apps/dex-ui` application and DEX contract/artifact package as an integrated local DEX product.
- The old target model (`targets/devcontainer`, `targets/code-server`) is only partially represented. Current scaffold templates have `devcontainer`/`docker` target fragments, but the legacy target directories and code-server target are not present as equivalent runtime targets.
- Some scaffold templates have been reimplemented as TypeScript template definitions in `@cfxdevkit/create`, but they are not a one-to-one materialized port of the old folder-based template system.
- No dedicated OpenHands repo slice exists yet; only the legacy `.cfxdevkit/openhands/` configuration remains.
- A few planned security/back-end items remain explicitly planned rather than implemented, such as KMS, OS keyring, and keystore-forward sidecar support.

## Evidence Snapshot

### Package Inventory

Current repository package manifests excluding generated/build folders and `.cfxdevkit`: 51 package manifests.

Legacy attached package manifests:

- `.cfxdevkit/devkit`: 21 package manifests.
- `.cfxdevkit/devkit-workspace`: 19 package manifests.
- Combined legacy total: 40 package manifests.

Current root package evidence:

- `package.json` identifies the new workspace as `@cfxdevkit/framework` and pins `pnpm@10.33.2` with Node `>=24.15.0`.
- `pnpm-workspace.yaml` registers workspace package families under `repos/cfx-config`, `repos/cfx-meta`, `repos/*/packages/*`, `repos/cfx-tools/devtools/*`, `repos/cfx-tools/templates/*`, `projects/*/apps/*`, `projects/*/packages/*`, and `projects/*/contracts`.

Legacy root package evidence:

- `.cfxdevkit/devkit/package.json` used `@cfxdevkit/monorepo`, version `1.2.5`, `pnpm@10.11.0`, and Turbo-based scripts such as `turbo build`, `turbo test`, and `turbo type-check`.
- `.cfxdevkit/devkit-workspace/package.json` used `devkit-workspace`, `pnpm@9.0.0`, direct Node scripts for scaffold/template/image operations, and separate image build commands.

### Current Major Package Names

Current package names include:

- Framework/core: `@cfxdevkit/cdk`, `@cfxdevkit/protocol`, `@cfxdevkit/devnode`, `@cfxdevkit/executor`, `@cfxdevkit/testing`.
- Keys/security: `@cfxdevkit/services`, `@cfxdevkit/wallet`.
- Solidity/contracts: `@cfxdevkit/abis`, `@cfxdevkit/contracts`, `@cfxdevkit/compiler`, `@cfxdevkit/contracts-extract`.
- UI: `@cfxdevkit/ui-core`, `@cfxdevkit/ui`, `@cfxdevkit/theme`, `@cfxdevkit/react`, `@cfxdevkit/defi-react`, `@cfxdevkit/wallet-connect`.
- Tools/platform: `@cfxdevkit/devnode-server`, `@cfxdevkit/client`, `@cfxdevkit/create`, `@cfxdevkit/mcp-server`, `@cfxdevkit/cli`, `cfxdevkit-vscode-extension`, `@cfxdevkit/arch-check`.
- LLM automation: `@cfxdevkit/llm-client`, `@cfxdevkit/llm-agents`, `@cfxdevkit/llm-tools`.
- Domains/projects: `@cfxdevkit/automation`, `@cfxdevkit/game-engine`, `@cfxdevkit/cas-*`, showcase apps, and project-local packages.

## Architecture and Dependency Improvements

### 1. Tiered Repository Layout

Legacy state:

- `.cfxdevkit/devkit` grouped SDK packages under `packages/` and private tooling under `devtools/`.
- `.cfxdevkit/devkit-workspace` grouped product/demo infrastructure under `packages/`, `apps/`, `templates/`, and `targets/`.
- The legacy repositories had useful boundaries, but the dependency architecture was mostly implicit in docs and folder names.

Current state:

- `README.md` and `ARCHITECTURE.md` define the current `repos/cfx-*` structure and the conceptual tier model.
- `repos/cfx-meta/arch-rules.yaml` provides machine-readable architecture rules.
- `docs/adr/0003-multi-repo-split.md` explains why the code was split by technical surface and why `cfx-keys` is a separate trust boundary.

Improvement:

- The current structure separates framework, key-handling, UI, Solidity, tools, domains, and projects more clearly than the legacy layout.
- The repo now has explicit one-way dependency rules and release/audit boundaries instead of relying only on convention.

Verification paths:

- `README.md`
- `ARCHITECTURE.md`
- `repos/cfx-meta/arch-rules.yaml`
- `docs/adr/0003-multi-repo-split.md`
- `pnpm-workspace.yaml`

### 2. Build and Task System

Legacy state:

- `.cfxdevkit/devkit/package.json` used Turbo (`turbo build`, `turbo test`, `turbo type-check`).
- `.cfxdevkit/devkit-workspace/package.json` used direct Node scripts and custom image/scaffold commands.

Current state:

- `package.json` centralizes commands around Moon: `moon run :build`, `moon run :lint`, `moon run :typecheck`, `moon run :check`.
- `docs/adr/0001-build-stack.md` records the decision to use pnpm 10+, Vite, Moon, Biome, Vitest, Playwright, Hardhat, Changesets, and TS project references.

Improvement:

- Build, lint, test, typecheck, security, architecture checks, LLM checks, and release flows now use one root model.
- Vendor lock-in was reduced by moving from Turbo to Moon and documenting why Vercel/Nx/Bazel alternatives were rejected.
- Node and pnpm versions are now pinned in CI and in the root package metadata.

Verification paths:

- `package.json`
- `docs/adr/0001-build-stack.md`
- `.github/workflows/ci.yml`
- `.moon/tasks/node.yml`

### 3. Dependency Surface Optimization

Legacy state:

- `.cfxdevkit/devkit` combined foundation, services, wallet, compiler, devnode, contracts, React, wallet-connect, and DeFi packages in one package family.
- `.cfxdevkit/devkit-workspace` introduced a separate product stack with `@devkit/*` packages and DEX scaffolding.

Current state:

- Core runtime packages live under `repos/cfx-core`.
- Key and keystore packages live under `repos/cfx-keys`.
- UI packages live under `repos/cfx-ui`.
- Solidity/compiler/ABI packages live under `repos/cfx-solidity`.
- Platform tooling lives under `repos/cfx-tools`, with local LLM automation grouped under `repos/cfx-tools/infra/`.
- Reusable verticals live under `repos/cfx-domain`.
- Applications live under `projects/*`.

Improvement:

- The most security-sensitive code (`@cfxdevkit/services`, `@cfxdevkit/wallet`) is isolated from UI and product code.
- The UI surface no longer sits beside key-handling code as a peer in one flat package directory.
- Standard ABI constants were split into `@cfxdevkit/abis`, a small leaf package with no cfxdevkit dependency cycle.
- Tooling packages such as `@cfxdevkit/create`, `@cfxdevkit/mcp-server`, `@cfxdevkit/devnode-server`, and `cfxdevkit-vscode-extension` are grouped as platform tools instead of mixed with runtime SDK packages.

Verification paths:

- `repos/cfx-core/package.json`
- `repos/cfx-keys/package.json`
- `repos/cfx-ui/package.json`
- `repos/cfx-solidity/package.json`
- `repos/cfx-tools/package.json`
- `repos/cfx-domain/package.json`
- `repos/cfx-solidity/packages/abis/README.md`

## Security Improvements

### 1. Formal Security Model

Legacy state:

- `.cfxdevkit/devkit/packages/services` included encryption and keystore functionality.
- Security existed in implementation, but there was no comparable top-level trust-tier document or explicit MCP/key-handling policy.

Current state:

- `SECURITY.md` documents reporting, trust tiers, key handling, supply chain, MCP/AI surface, smart-contract security, and cross-tier rules.
- `docs/adr/0002-keystore.md` documents the keystore strategy.
- `docs/keystore-docker.md` documents hardened container patterns for encrypted keystore usage.

Improvement:

- Key handling is now policy-driven and separated by environment: production KMS/HSM, OS keyring, encrypted file, CI OIDC/tokens, and session keys.
- The encrypted file backend is explicitly a fallback, not a production recommendation.
- `keytar` is explicitly forbidden in favor of `@napi-rs/keyring` for future native keyring support.
- Session keys are established as the default for automation.
- MCP tools are constrained by an explicit allowlist and must not sign with non-session keys.

Verification paths:

- `SECURITY.md`
- `docs/adr/0002-keystore.md`
- `docs/keystore-docker.md`
- `repos/cfx-keys/packages/services/README.md`
- `repos/cfx-keys/packages/wallet/README.md`

### 2. CI and Supply-Chain Controls

Legacy state:

- `.cfxdevkit/devkit/package.json` had basic package-manager overrides and `onlyBuiltDependencies`/`ignoredBuiltDependencies`, but CI/release/security policy was not as formalized.
- `.cfxdevkit/devkit-workspace` had scaffold/image scripts but not the same root security workflow model.

Current state:

- `.github/workflows/ci.yml` validates install, build, lint, typecheck, and tests on `main` and `dev`.
- `.github/workflows/security.yml` runs production dependency audit, secret leak scan, and CodeQL.
- `.github/workflows/release.yml` publishes packages with npm provenance permissions.
- `.github/workflows/changeset-release.yml` versions and publishes through Changesets.
- `.github/workflows/build-docs.yml` and `.github/workflows/deploy-docs.yml` automate docs image build and deployment with rollback logic.

Improvement:

- Security scanning and CodeQL are now first-class CI jobs.
- Release publishing is provenance-aware.
- Docs deployment is separated into image build and deployment workflows, reducing manual operational drift.

Verification paths:

- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/release.yml`
- `.github/workflows/changeset-release.yml`
- `.github/workflows/build-docs.yml`
- `.github/workflows/deploy-docs.yml`

## Platform and Runtime Improvements

### 1. Local Devnode Control Plane

Legacy state:

- `.cfxdevkit/devkit` had `@cfxdevkit/devnode` and private `devtools/devkit` Express/Socket.IO tooling.
- The legacy README described a browser UI with node lifecycle, accounts, contracts, bootstrap, mining, network, and wallet pages.

Current state:

- `@cfxdevkit/devnode` remains as a programmatic dev/test package under `repos/cfx-core/packages/devnode`.
- `@cfxdevkit/devnode-server` is now a dedicated Hono control plane under `repos/cfx-tools/packages/devnode-server`.
- `@cfxdevkit/client` provides a typed HTTP client for that control plane.

Improvement:

- Runtime control is now a reusable backend contract rather than only an embedded private dashboard backend.
- The backend exposes route groups for node lifecycle, node profiles, keystore, accounts, compiler, contracts, deploy, network, mining, bootstrap, and session keys.
- Wallet-scoped runtime state is represented by keystore-adjacent `.runtime` state files.

Verification paths:

- `repos/cfx-core/packages/devnode/README.md`
- `repos/cfx-tools/packages/devnode-server/package.json`
- `repos/cfx-tools/packages/devnode-server/src/app.ts`
- `repos/cfx-tools/packages/client/package.json`

### 2. MCP Server

Legacy state:

- `.cfxdevkit/devkit-workspace/packages/mcp-server` provided the previous MCP surface.

Current state:

- `@cfxdevkit/mcp-server` lives under `repos/cfx-tools/packages/mcp-server`.
- It now aligns with the shared backend contract and typed operation registry.

Improvement:

- MCP is treated as a platform-tier tool, not just a workspace helper.
- The documentation states tool allowlisting, no raw private keys, shared backend semantics, wallet-scoped network profiles, tracked contracts, and reset/recovery constraints.

Verification paths:

- `repos/cfx-tools/packages/mcp-server/README.md`
- `repos/cfx-tools/packages/mcp-server/src/tools/registry.ts`
- `repos/cfx-tools/packages/mcp-server/src/handlers/`
- `SECURITY.md`

### 3. VS Code Extension

Legacy state:

- `.cfxdevkit/devkit-workspace/packages/vscode-extension` provided the previous editor integration.

Current state:

- `cfxdevkit-vscode-extension` lives under `repos/cfx-tools/packages/vscode-extension`.
- Its README documents network selection, local/testnet/mainnet workflows, keystore type selection, wallet roots, derived accounts, deploy/import flows, tree views, and shared backend integration.

Improvement:

- The extension now follows the same backend contract as MCP and showcase-local.
- It separates keystore type, wallet root, account selection, and network profile concepts more clearly.
- It persists deploy records in `.cfxdevkit/deployments.json` and avoids passwordless destructive reset commands.

Verification paths:

- `repos/cfx-tools/packages/vscode-extension/README.md`
- `repos/cfx-tools/packages/vscode-extension/src/`

## Framework Package Improvements

### 1. Contracts and ABIs

Legacy state:

- `.cfxdevkit/devkit/packages/contracts` combined generated ABIs, bytecode, and deployed addresses.
- `.cfxdevkit/devkit/devtools/contracts` housed Hardhat sources and generation scripts.

Current state:

- `@cfxdevkit/abis` provides a tiny standard ABI package.
- `@cfxdevkit/contracts` provides standard contract bindings and framework-native read/write/deploy helpers.
- `@cfxdevkit/compiler` and `@cfxdevkit/codegen-contracts` are separated under `repos/cfx-tools`.

Improvement:

- ABI constants can be consumed without pulling contract execution machinery.
- eSpace and Core Space support are documented in `@cfxdevkit/contracts`.
- Solidity concerns are separated from core runtime and UI concerns.

Verification paths:

- `repos/cfx-solidity/packages/abis/README.md`
- `repos/cfx-solidity/packages/contracts/README.md`
- `repos/cfx-tools/packages/compiler/README.md`
- `repos/cfx-tools/packages/codegen-contracts/package.json`

### 2. UI and Design System

Legacy state:

- `.cfxdevkit/devkit/packages/react`, `theme`, `wallet-connect`, and `defi-react` provided React and wallet UI layers.
- `.cfxdevkit/devkit-workspace/packages/ui-shared` provided project-scaffold UI materialization.

Current state:

- `@cfxdevkit/ui-core`, `@cfxdevkit/ui`, `@cfxdevkit/theme`, `@cfxdevkit/react`, `@cfxdevkit/defi-react`, and `@cfxdevkit/wallet-connect` live in `repos/cfx-ui`.
- `@cfxdevkit/ui` documents reusable Tailwind-first components such as segmented controls, fields, notices, metrics, wallet buttons, token selectors, and asset conversion panels.

Improvement:

- The UI surface is now separated from keys and core runtime.
- `@cfxdevkit/ui-core` and `@cfxdevkit/ui` provide a cleaner split between foundations and styled components.
- Product-specific orchestration remains at app level instead of being embedded in shared UI.

Verification paths:

- `repos/cfx-ui/packages/ui/README.md`
- `repos/cfx-ui/packages/ui-core/README.md`
- `repos/cfx-ui/packages/theme/package.json`
- `docs/architecture/ui-foundation.md`

## Application and Domain Work

### 1. CAS Port

Legacy state:

- `.cfxdevkit/cas` contained `conflux-cas`, `conflux-contracts`, and `conflux-sdk`.

Current state:

- CAS is represented as `projects/cas` with `apps/backend`, `apps/frontend`, `packages/setup`, and `packages/shared`.
- CAS has project-level docs and OpenSpec specs.

Improvement:

- CAS is now correctly treated as a project-level application rather than mixed into framework/runtime packages.
- Setup and shared project code are separated from frontend/backend apps.
- CAS has audit/status documentation and specs for wizard, token, wallet, job, nav, env, and safety surfaces.

Verification paths:

- `projects/cas/README.md`
- `projects/cas/STRUCTURE.md`
- `openspec/specs/cas-*/`
- `projects/cas/apps/backend/package.json`
- `projects/cas/apps/frontend/package.json`
- `projects/cas/packages/setup/package.json`
- `openspec/specs/cas-*`

### 2. Domain Packages

Legacy state:

- Domain logic was spread through project repos and old package groups.

Current state:

- Reusable domain logic lives in `repos/cfx-domain/packages/automation` and `repos/cfx-domain/packages/game-engine`.

Improvement:

- Automation and game engine concepts are separated from application code and from framework primitives.
- The `@cfxdevkit/automation` package now has its own dependency surface and tests.

Verification paths:

- `repos/cfx-domain/packages/automation/package.json`
- `repos/cfx-domain/packages/automation/README.md`
- `repos/cfx-domain/packages/game-engine/package.json`
- `repos/cfx-domain/packages/game-engine/README.md`

### 3. Showcase Apps

Current additions:

- `projects/examples/apps/showcase-local` provides a local runtime showcase with API proxy routes, keystore panels, devnode UI, deploy/compiler/session-key pages, and shared runtime OpenSpec records.
- `projects/examples/apps/showcase-public` provides public-facing showcase pages for Core, DeFi, keys, wallet, SIWE, and UI kit surfaces.
- `projects/examples/packages/showcase-ui` provides shared showcase UI pieces.

Improvement:

- The old dashboard/demo concepts are now represented as examples that exercise the shared backend and packages instead of being only private devtool UI.

Verification paths:

- `projects/examples/apps/showcase-local/package.json`
- `projects/examples/apps/showcase-local/app/api/`
- `projects/examples/apps/showcase-local/openspec/changes/`
- `projects/examples/apps/showcase-public/package.json`
- `projects/examples/apps/showcase-public/app/`
- `projects/examples/packages/showcase-ui/package.json`

## Scaffold and Template Work

Legacy state:

- `.cfxdevkit/devkit-workspace/templates/minimal-dapp`
- `.cfxdevkit/devkit-workspace/templates/project-example`
- `.cfxdevkit/devkit-workspace/templates/wallet-probe`
- `.cfxdevkit/devkit-workspace/targets/devcontainer`
- `.cfxdevkit/devkit-workspace/targets/code-server`

Current state:

- `@cfxdevkit/create` lives at `repos/cfx-tools/packages/scaffold-cli`.
- Templates are currently defined in TypeScript files under `repos/cfx-tools/packages/scaffold-cli/src/templates/`.
- Available template definitions include `minimal-dapp`, `wallet-probe`, `project-example`, and compatibility aliases such as `basic`, `react`, and `solidity`.
- `project-example` includes `devcontainer` and `docker` target fragments in code.

Improvement:

- The create/scaffold surface is publishable as `@cfxdevkit/create` and aligns with `npm create @cfxdevkit`.
- The template registry is testable as TypeScript rather than only a copied folder structure.

Missing or partial:

- The old folder-based template/target model has not been ported one-to-one.
- The old `code-server` target is not visible as an equivalent target in the current template definitions.
- The old target decomposition (`targets/devcontainer`, `targets/code-server`, `packages/devkit-base`) is not present as a full current runtime image pipeline.

Verification paths:

- `.cfxdevkit/devkit-workspace/templates/`
- `.cfxdevkit/devkit-workspace/targets/`
- `repos/cfx-tools/packages/scaffold-cli/package.json`
- `repos/cfx-tools/packages/scaffold-cli/src/templates.ts`
- `repos/cfx-tools/packages/scaffold-cli/src/templates/minimal-dapp.ts`
- `repos/cfx-tools/packages/scaffold-cli/src/templates/project-example.ts`
- `repos/cfx-tools/packages/scaffold-cli/src/templates/wallet-probe.ts`

## LLM and Code Intelligence Additions

Current additions with no direct equivalent in the old devkit codebase:

- `repos/cfx-tools/infra` packages: `@cfxdevkit/llm-client`, `@cfxdevkit/llm-agents`, `@cfxdevkit/llm-tools`.
- Root `llm:*` scripts for actions, review, validation, docs pipeline, release readiness, CI/CD checks, corpus generation, and local Lemonade Server integration.
- `artifacts/llm/` as ignored output for generated reports and corpus data.
- GitNexus integration scripts in root `package.json` and project instructions.

Improvement:

- The new repository has an explicit AI-assisted maintenance layer for docs, CI, changesets, validation, review, and corpus metadata.
- LLM automation is isolated in `repos/cfx-tools/infra` so it does not become runtime dependency surface for apps or packages.

Verification paths:

- `repos/cfx-tools/infra/llm-tools/README.md`
- `repos/cfx-tools/infra/llm-client/README.md`
- `repos/cfx-tools/infra/llm-agents/README.md`
- `docs/llm-automation-agents.md`
- `docs/llm-fine-tuning-plan.md`
- `package.json`

## Documentation and Governance Additions

Current additions:

- Root architecture and security model: `ARCHITECTURE.md`, `SECURITY.md`.
- ADRs: `docs/adr/0001-build-stack.md`, `docs/adr/0002-keystore.md`, `docs/adr/0003-multi-repo-split.md`.
- Package layout and design rules: `docs/architecture/package-layout.md`, `docs/architecture/framework-design-principles.md`, `docs/architecture/framework-error-types.md`, `docs/architecture/ui-foundation.md`, `docs/architecture/keystore-session-provider.md`.
- OpenSpec change/spec process under `openspec/`.
- Repository-scoped docs for package groups and projects.

Improvement:

- The current repo includes verifiable governance artifacts that explain why code moved, how dependencies are allowed to flow, what security boundaries exist, and how future changes should be specified.

Verification paths:

- `docs/README.md`
- `docs/STRUCTURE.md`
- `OPENSPEC.md`
- `openspec/specs/`
- `docs/architecture/`
- `docs/adr/`

## Missing or Remaining Work

### 1. Local DEX Stack Port

Status: not fully ported.

Legacy evidence:

- `.cfxdevkit/devkit-workspace/apps/dex-ui/package.json` describes a DEX swap UI and PayableVault demo for the local Conflux dev node.
- `.cfxdevkit/devkit-workspace/docs/components.md` lists `apps/dex-ui` and `@cfxdevkit/dex-contracts` as the local DEX UI and contract artifact package.
- `.cfxdevkit/devkit-workspace/README.md` describes a local Uniswap V2-compatible DEX with seeded token pairs and a DEX UI.

Current evidence:

- `repos/cfx-ui/packages/defi-react` and `repos/cfx-ui/packages/ui` contain DeFi/UI primitives.
- `projects/cas/packages/setup/src/steps/contract-mode.ts` references Swappi router/factory configuration and explicitly notes that local devnodes do not have Swappi pre-deployed.
- No current equivalent of `apps/dex-ui` was found under `projects/`, `repos/`, or `apps/`.
- No current package named `@cfxdevkit/dex-contracts` exists in the active package inventory.

Required follow-up:

- Decide whether the legacy local DEX should become a project under `projects/examples`, a platform tool under `repos/cfx-tools`, or a domain package under `repos/cfx-domain`.
- Port or replace the Uniswap V2-compatible contract artifacts, token-pair seeding, price/feed bootstrap scripts, and DEX UI.
- Integrate DEX state with `@cfxdevkit/devnode-server`, MCP, and VS Code extension if it remains part of the promised product surface.
- Add OpenSpec change(s) for local DEX stack behavior, deployment, seeded pools, and UI verification.

### 2. Runtime Image and Target Pipeline

Status: partial.

Legacy evidence:

- `.cfxdevkit/devkit-workspace/targets/devcontainer`
- `.cfxdevkit/devkit-workspace/targets/code-server`
- `.cfxdevkit/devkit-workspace/packages/devkit-base`
- `.cfxdevkit/devkit-workspace/docs/specs/docker-decomposition.md`

Current evidence:

- Root `.devcontainer` exists for active monorepo development.
- `@cfxdevkit/create` embeds some target fragments, including `devcontainer` and `docker` for `project-example`.
- The old `code-server` target is not present as a current equivalent target directory or scaffold target.

Required follow-up:

- Decide whether code-server remains in scope.
- If yes, port `targets/code-server` as a first-class generated target or document that it was intentionally dropped.
- Add verification that generated projects can run in all supported targets.

### 3. Scaffold Template Parity

Status: partial.

Legacy evidence:

- Folder templates existed under `.cfxdevkit/devkit-workspace/templates/`.
- Legacy templates included materialized packages such as `ui-shared` and `conflux-wallet`.

Current evidence:

- Template names exist in TypeScript definitions under `repos/cfx-tools/packages/scaffold-cli/src/templates/`.
- The current templates are not folder-for-folder ports and do not preserve the full legacy materialization model.

Required follow-up:

- Compare generated output from old `scaffold-cli` against new `@cfxdevkit/create` for `minimal-dapp`, `project-example`, and `wallet-probe`.
- Decide which differences are intentional simplifications and which are missing features.
- Add snapshot or structural tests for generated outputs.

### 4. OpenHands Integration

Status: mostly missing or placeholder.

Legacy evidence:

- `.cfxdevkit/openhands/settings.json`
- `.cfxdevkit/openhands/.jwt_secret`

Current evidence:

- `.cfxdevkit/openhands/` exists as legacy configuration, but no comparable first-class package or project surface is visible in the active package inventory.

Required follow-up:

- Decide whether OpenHands remains part of the product.
- If retained, add explicit package/docs/spec ownership and remove any secret-like legacy artifacts from migration scope.

### 5. Planned Keystore Backends

Status: planned, not complete.

Current evidence:

- `SECURITY.md` describes OS keyring via `@napi-rs/keyring` as planned.
- `docs/keystore-docker.md` describes `@cfxdevkit/services/keystore-forward` as planned.
- `docs/keystore-docker.md` lists KMS and OS keychain backends as planned.

Required follow-up:

- Add implementation specs and packages for OS keyring, KMS/Vault, and sidecar/forwarded keystore if those are still in scope.
- Ensure production deploy docs do not imply these backends already ship.

### 6. Dependency Configuration Cleanup

Status: needs verification.

Current evidence:

- Root `package.json` currently lists `better-sqlite3` under both `pnpm.onlyBuiltDependencies` and `pnpm.ignoredBuiltDependencies`.
- `repos/cfx-domain/packages/automation/package.json` depends on `better-sqlite3` `^12.10.0`.

Required follow-up:

- Reconcile the pnpm build-script policy so native dependencies are unambiguous.
- Keep `better-sqlite3` in `onlyBuiltDependencies` if the automation package requires its install script, and remove it from `ignoredBuiltDependencies` unless there is a documented reason.

### 7. Release Readiness

Status: strong foundation, still pre-release.

Current evidence:

- Many packages are versioned `2.0.0`, while some repo/package roots remain `0.0.0`.
- `repos/cfx-meta/arch-rules.yaml` marks the lifecycle as `pre-release`.
- Release and changeset workflows exist.

Required follow-up:

- Verify every publishable package has correct version, exports, files, README, API/STRUCTURE docs, and Changesets before release.
- Run the release dry-run path and record output for billing/release audit.

## Improvement Matrix

| Area | Legacy state | Current state | Result |
|---|---|---|---|
| Workspace shape | Separate `devkit`, `devkit-workspace`, and project trees | Unified active repo with `repos/cfx-*` slices and `projects/*` | Improved maintainability and ownership |
| Build orchestration | Turbo plus ad hoc scripts | Moon + pnpm + Vite + Biome + Vitest | More deterministic and vendor-neutral |
| Dependency boundaries | Mostly implicit package layers | Machine-readable tier rules and package slices | Clearer, safer dependency graph |
| Key handling | Keystore implementation in services | Dedicated `cfx-keys` trust boundary and security policy | Stronger security posture |
| MCP | Workspace helper | Platform package with shared backend contract | More reusable and controlled |
| Devnode backend | Private devtool/dashboard backend plus devnode package | Shared `@cfxdevkit/devnode-server` and typed client | Better integration surface |
| VS Code extension | Devkit-workspace package | Platform package aligned with shared backend | More consistent UX and state model |
| Scaffold CLI | Folder assets and target model | `@cfxdevkit/create` with TS templates | Partially ported, publishable surface improved |
| Local DEX | DEX UI + DEX contracts in legacy workspace | DeFi primitives exist, but full local DEX stack missing | Needs porting/decision |
| CAS | Separate attached repo | Project under `projects/cas` with setup/shared packages and specs | Ported and better structured |
| CI/security | Basic scripts and local checks | CI, security audit, CodeQL, provenance release, docs deploy | Stronger operational controls |
| Docs/governance | Useful legacy docs, less formal | ADRs, OpenSpec, architecture, security, package layout | Major improvement |
| LLM automation | Not present as first-class slice | `repos/cfx-tools/infra` and `llm:*` workflows | New addition |

## Recommended Next Work Items

1. Create an OpenSpec change for `local-dex-stack-port` covering DEX contracts, seeded token pairs, DEX UI, MCP tools, VS Code extension surface, and devnode-server integration.
2. Create an OpenSpec change for `scaffold-target-parity` covering folder-template parity, generated-output snapshots, `code-server` target decision, and materialized package strategy.
3. Reconcile root pnpm native dependency policy for `better-sqlite3` and document the final policy in `SECURITY.md` or a release note.
4. Decide whether OpenHands remains in scope. If not, archive/remove placeholder references; if yes, add docs, package ownership, and security handling around `.cfxdevkit/openhands/`.
5. Add release-readiness evidence for each publishable package: exports maps, dist files, README/API/STRUCTURE docs, test status, and Changesets.
6. Produce a generated-output comparison for old vs new scaffold templates and attach the output to this report or a follow-up audit artifact.
7. Add a migration status table for each legacy package once the local DEX and scaffold parity decisions are finalized.

## Billing-Relevant Summary

Work completed in the new repository is substantial and verifiable. The merge/refactor includes architecture design, package relocation, dependency boundary optimization, security model creation, CI/release hardening, devnode backend expansion, MCP modernization, VS Code extension alignment, CAS project migration, domain package creation, LLM automation, and documentation governance.

The largest remaining functional gap is the local DEX stack from `devkit-workspace`. It should be treated as incomplete unless the project intentionally dropped it. The second-largest gap is scaffold/target parity: current `@cfxdevkit/create` has working template definitions, but it is not yet a full one-to-one migration of the old folder-based template and target system.
