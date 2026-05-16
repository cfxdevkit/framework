The original chapter checklist is obsolete. The remaining work is a backend-first convergence and a full workspace UI rewrite.

## 1. Complete the reusable backend surface

- [ ] 1.1 Audit the current showcase-local, VS Code extension, and MCP command surfaces and define the shared operations matrix
- [x] 1.2 Move remaining app-local runtime logic for compiler, session-key, deploy, and contract interaction into the shared local-runtime control plane
- [x] 1.3 Add backend-owned wallet account operations: list derived accounts, activate account, reveal protected material through the two-step flow, and keep account/funding logic reusable for the later faucet exploration
- [x] 1.4 Make the shared contract surface cover deploy, track deployed contracts in the first pass, and expose read and write operations with explicit network and space context
- [x] 1.5 Add a supported extension mechanism so a project can attach custom routes or route groups to the runtime app while reusing shared services
- [x] 1.6 Extend the typed client contract so the showcase, VS Code extension, and MCP can all consume the same backend surface

## 2. Reduce showcase-local to thin adapters

- [x] 2.1 Replace any remaining app-local backend ownership in `app/api/compile/*`, `app/api/session-key/*`, and `app/api/deploy/*` with thin adapters to the shared runtime contract
- [x] 2.2 Add thin adapters for backend-owned account selection, reveal flows, template/bootstrap flows, contract interaction, deployed-contract tracking, and the custom block-number extension route
- [x] 2.3 Ensure all same-origin routes are `runtime = 'nodejs'` and return payloads matching the typed shared client surface

## 3. Rewrite the UI/UX around a tree workspace

- [x] 3.1 Replace the current stacked-card structure with one unified tree-style left rail and a focused detail pane
- [x] 3.2 Model the unified tree after the VS Code extension mental model: network selection, node controls, wallets, derived accounts, and tracked deployed contracts
- [x] 3.3 Move mutation-heavy flows into modal or command-sheet interactions so the main view stays uncluttered
- [x] 3.4 Keep a persistent audit/event log visible as shared operational context
- [x] 3.5 Show selected resource detail in the main pane: node status, wallet metadata, account details, contract ABI/actions, and custom operation results

## 4. Match extension operations and expose a custom backend extension example

- [ ] 4.1 Ensure the showcase demonstrates the complete agreed operational surface already required for shared backend parity: network switch, keystore lifecycle, wallet root selection, derived account selection, node lifecycle, deployed-contract tracking, compile, session-key flows, deploy, ABI-driven interaction, and secret reveal flows
- [x] 4.2 Add one showcase-specific example operation implemented as a custom backend route that reuses shared runtime services and returns the current block number
- [x] 4.3 Surface that custom operation in the UI and document how it can also be called programmatically by other consumers

## 5. Documentation and validation

- [x] 5.1 Rewrite the showcase-local OpenSpec proposal, design, specs, and tasks to match the workspace product rather than the old chapter app
- [x] 5.2 Update docs to make the backend-first ownership model explicit: UI is client, backend owns logic, and MCP aligns to the same shared backend contract
- [x] 5.3 Verify `.local-data/` is ignored in the repository where showcase-local writes local state
- [x] 5.4 Validate `pnpm --filter @cfxdevkit/devnode-server test`
- [x] 5.5 Validate `pnpm --filter @cfxdevkit/devnode-server build`
- [x] 5.6 Validate `pnpm --filter @cfxdevkit/example-showcase-local typecheck`
- [x] 5.7 Validate `pnpm --filter @cfxdevkit/example-showcase-local build`
- [ ] 5.8 Validate the final command surface against the VS Code extension and MCP integration matrix
