# May 2026 Legacy Migration Completed Work

This document explains the May 2026 work added to the completed-task QMS sheet. It is based on the legacy migration audit in `docs/legacy-migration-refactor-audit.md`, comparison with the legacy `.cfxdevkit/devkit` and `.cfxdevkit/devkit-workspace` trees, and the repository commit history.

## Summary

May 2026 work moved the DevKit from a legacy application/tooling layout toward a governed framework repository with clearer package boundaries, CI validation, release preparation, local developer apps, CAS migration artifacts, and LLM/GitNexus code intelligence. The work is not a file-for-file port: it is a refactor and modernization that preserves the useful legacy capabilities while making the growing codebase easier to verify, automate, and maintain.

## Completed Task Rows

The completed-task CSV now uses repository scope as the minimum subdivision. For the main framework surfaces, the row names also identify the final `@cfxdevkit/*` packages so the work can be reviewed and billed without merging unrelated packages into one item.

### Repo and package rows

| QMS row | Scope | Evidence |
| --- | --- | --- |
| cfx-config: `@cfxdevkit/tsconfig`, `@cfxdevkit/biome-config`, `@cfxdevkit/moon-config` | Shared TypeScript, Biome, and Moon configuration packages used by the framework workspace and CI. | `repos/cfx-config/packages/*`, `tsconfig.base.json`, `biome.json` |
| cfx-meta: `@cfxdevkit/arch-rules` architecture governance | Machine-readable architecture and dependency boundary rules used by validation and code intelligence workflows. | `repos/cfx-meta/arch-rules.yaml`, `repos/cfx-meta/packages/arch-rules` |
| cfx-core: `@cfxdevkit/cdk` | Core client foundation, chain metadata, types, errors, units, and Conflux client behavior carried forward from the legacy toolkit into a typed package. | `repos/cfx-core/packages/core` |
| cfx-core: `@cfxdevkit/devnode` | Local devnode lifecycle package and reusable local Conflux support. | `repos/cfx-core/packages/devnode` |
| cfx-core: `@cfxdevkit/protocol` | Protocol/RPC method consolidation and typed protocol helpers. | `repos/cfx-core/packages/protocol` |
| cfx-core: `@cfxdevkit/executor`, `@cfxdevkit/testing` | Automation primitives and shared testing support for framework packages. | `repos/cfx-core/packages/executor`, `repos/cfx-core/packages/testing` |
| cfx-solidity: `@cfxdevkit/compiler`, `@cfxdevkit/contracts` | Solidity compiler pipeline, contract templates, and reusable contract package support. | `repos/cfx-solidity/packages/compiler`, `repos/cfx-solidity/packages/contracts` |
| cfx-solidity: `@cfxdevkit/abis`, `@cfxdevkit/codegen-contracts` | ABI package and contract code-generation/extraction support. | `repos/cfx-solidity/packages/abis`, `repos/cfx-solidity/packages/contracts-extract` |
| cfx-keys: `@cfxdevkit/wallet`, `@cfxdevkit/services` | Wallet, signer, keystore, and service abstractions replacing older scattered wallet behavior. | `repos/cfx-keys/packages/wallet`, `repos/cfx-keys/packages/services` |
| cfx-keys: `@cfxdevkit/wallet` hardware adapters for Ledger, OneKey, and Satochip | Hardware-wallet support was added as a first-class wallet package surface instead of a legacy app-local implementation. | `repos/cfx-keys/packages/wallet/src/hardware/`, `docs/keystore-docker.md`, `docs/adr/0002-keystore.md` |
| cfx-keys and projects/examples: full Ledger wallet implementation and showcase coverage | Ledger-specific implementation and evidence for the hardware-wallet showcase flow, including WebHID/Ethereum app behavior, eSpace/Core derivation expectations, signing behavior, and APDU limitation documentation. | `repos/cfx-keys/packages/wallet/src/hardware/ledger/`, `artifacts/plan/phase-2-showcase-public.md`, `projects/examples/SHOWCASE-COVERAGE.md` |
| cfx-tools: `@cfxdevkit/devnode-server`, `@cfxdevkit/client` | Shared backend/client control plane for devnode lifecycle, routes, node profiles, and keystore-aware workflows. | `repos/cfx-tools/packages/devnode-server`, `repos/cfx-tools/packages/client` |
| cfx-tools: `@cfxdevkit/create`, `@cfxdevkit/cli` | Scaffold and CLI migration into framework packages. | `repos/cfx-tools/packages/scaffold-cli`, `repos/cfx-tools/packages/cli` |
| cfx-tools: `@cfxdevkit/mcp-server` and VS Code extension | MCP and VS Code control-plane alignment for local development workflows. | `repos/cfx-tools/packages/mcp-server`, `repos/cfx-tools/packages/vscode-extension` |
| cfx-tools: `@cfxdevkit/arch-check`, `@cfxdevkit/docs-site` | Architecture validation and documentation-site support. | `repos/cfx-tools/packages/arch-check`, `repos/cfx-tools/packages/docs-site` |
| cfx-ui: `@cfxdevkit/theme`, `@cfxdevkit/ui-core`, `@cfxdevkit/ui` | UI foundation, theme exports, and shared component packages. | `repos/cfx-ui/packages/theme`, `repos/cfx-ui/packages/ui-core`, `repos/cfx-ui/packages/ui` |
| cfx-ui: `@cfxdevkit/react`, `@cfxdevkit/wallet-connect`, `@cfxdevkit/defi-react` | React, wallet connection, SIWE, and DeFi hooks/packages. | `repos/cfx-ui/packages/react`, `repos/cfx-ui/packages/wallet-connect`, `repos/cfx-ui/packages/defi-react` |
| cfx-domain: `@cfxdevkit/automation`, `@cfxdevkit/game-engine` | Domain package split for automation and game-engine surfaces. | `repos/cfx-domain/packages/automation`, `repos/cfx-domain/packages/game-engine` |
| cfx-llm: `@cfxdevkit/llm-tools`, `@cfxdevkit/llm-client`, `@cfxdevkit/llm-agents` | Local LLM automation, agent tooling, corpus/report workflows, and GitNexus-aware repository intelligence. | `repos/cfx-llm/packages/llm-tools`, `repos/cfx-llm/packages/llm-client`, `repos/cfx-llm/packages/llm-agents`, `artifacts/llm/` |
| projects/examples: showcase-local and showcase-public migration | Project-level showcase migration and replacement of legacy showcase surfaces. | `projects/examples/`, `projects/*/README.md` |
| projects/cas: CAS migration documentation and audit alignment | CAS project migration evidence, status docs, structure docs, and audit alignment. | `projects/cas/README.md`, `projects/cas/STRUCTURE.md`, `projects/cas/AUDITS.md` |
| docs/qms: legacy migration work audit and missing-work register | Task-level work audit, QMS evidence docs, and explicit missing-work register. | `docs/legacy-migration-refactor-audit.md`, `docs/qms/` |

### Cross-cutting commit references

- `4f26c05` - docs(adr): 0003 multi-repo split by technical surface
- `033b269` - refactor: rename framework packages to @cfxdevkit scope
- `49b2c7c` - feat: close porting gaps for Tier 0/1 packages
- `52f3d96` - fix: allow better-sqlite3 build scripts and upgrade to v12 for Node 24 support
- `15f7a58` - fix: correct theme package exports to match vite-plugin-dts flat output
- `27fa35a` - fix(devnode-server): increase test timeouts to 60s for slower CI runners
- `599d4db` - feat: enhance client API with node profile and keystore improvements
- `5a346fe` - refactor(devnode-server): remove keystore domain and operations modules
- `9be6bac` - feat(wallet): hardware-wallet adapters for OneKey and Satochip
- `5fd1ccf` - feat(ledger): disable Core message signing, clarify APDU limitations
- `a2d4126` - chore(deps): bump @ledgerhq/hw-transport-node-hid from 6.33.1 to 6.33.2
- `0dac250` - feat(examples): add showcase-public & showcase-local apps, refactor showcase-ui
- `0ffac54` - feat: implement unified workspace UI for showcase-local
- `c047685` - docs: update CAS README and structure docs
- `b1b31f4` - feat(devcontainer): integrate Lemonade Server support and GitNexus CLI registration
- `08feb62` - feat: migrate arch-rules foundation and update LLM tools
- `3f89e68` - feat(llm-tools): add docs-upkeep command for folder-by-folder doc maintenance

### GitNexus and LLM emphasis

The `cfx-llm`, `cfx-meta`, and documentation rows should be read together. They cover the work that lets local LLMs manage the repository through indexed symbols, relationships, execution flows, architecture rules, corpus files, reports, and agent-facing instructions. This also helps cloud models operate more efficiently: instead of spending tokens rediscovering the whole monorepo, they can use GitNexus, OpenSpec, architecture rules, and the curated LLM artifacts as a compact map of the growing codebase.

## Missing Work Carried Forward

The audit intentionally records remaining work so completed task rows are transparent and do not overclaim completion. The main next items are:

- Complete local DEX/Swappi parity and decide whether it belongs in `projects/examples`, `repos/cfx-domain`, or both.
- Finish scaffold/template parity for all legacy project targets that are still relevant.
- Resolve target/code-server parity and whether browser IDE workflows stay in scope.
- Decide how much legacy OpenHands configuration should be migrated versus replaced by the current LLM/GitNexus workflow.
- Finalize planned keystore backends beyond file and in-memory support.
- Continue release-readiness cleanup for native dependency policy, package metadata, and public package validation.

## Task and Work Audit Notes

These rows represent meaningful completed tasks, not minor housekeeping. The work combines code migration, architectural refactoring, CI stabilization, documentation governance, and model-assisted repository intelligence. Commit references are provided where possible; some evidence is file/state based because the current audit document itself is newly generated for task verification.
