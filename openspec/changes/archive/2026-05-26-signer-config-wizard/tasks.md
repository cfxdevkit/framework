## P1 — Config layer in `@cfxdevkit/signer-session`

- [x] **P1.1** Create `src/config.ts` with:
  - `SIGNER_CONFIG_PATH` = `.cfxdevkit/signer.json` (resolved from `findWorkspaceRoot(cwd)`)
  - `SignerConfig` and `SignerEntry` types (see design.md)
  - `defaultSignerConfig(): SignerConfig` → `{ defaultSigner: 'quick', signers: { quick: { kind: 'memory' } } }`
  - `readSignerConfig(cwd?): Promise<SignerConfig>` → reads file or returns default
  - `writeSignerConfig(config, cwd?): Promise<void>` → writes JSON, creates `.cfxdevkit/` dir
  - `resolveSignerEntry(config, name?): SignerEntry` → returns `config.signers[name ?? config.defaultSigner]`

- [x] **P1.2** Create `createSignerSessionFromConfig(name?, cwd?)` in `src/index.ts`:
  - Calls `readSignerConfig`, `resolveSignerEntry`, then dispatches to the correct backend
  - For `memory` kind: generates a fresh `privateKey` via `generatePrivateKey()` (from viem)
  - Adds `EPHEMERAL_WARNING` to the session label for memory kind

- [x] **P1.3** Export `readSignerConfig`, `writeSignerConfig`, `SignerConfig`, `SignerEntry`,
  `createSignerSessionFromConfig` from `src/index.ts`

- [x] **P1.4** Add `@cfxdevkit/workspace-utils` dep for `findWorkspaceRoot`

- [x] **P1.5** `pnpm run typecheck` and `pnpm run test` pass for `signer-session`

## P2 — `cdk signer` namespace in tooling-cli

- [x] **P2.1** Create `infra/tooling-cli/src/signer-namespace.ts` with
  `signerToolingNamespace` and `runSignerCli`:

  **`cdk signer setup`** (interactive wizard via `@inquirer/prompts`):
  1. `select`: "Choose signer backend" — Memory (ephemeral), File keystore, OneKey, Ledger
  2. If File keystore: `input` for path (default `.cfxdevkit/keystore.json`), service, account, accountIndex
  3. If OneKey/Ledger: `input` for account index, confirm paths shown
  4. `input`: "Signer name" (default `dev-wallet`)
  5. Write `signer.json` via `writeSignerConfig`
  6. Add `.cfxdevkit/signer.json` to `.gitignore` if not present
  7. Print success + address (skip address for hardware — device not required at setup)

  **`cdk signer status`**:
  - Print: signer name, kind, config details
  - For file-keystore: if `CFX_PASSPHRASE` is set, also print resolved eSpace address

  **`cdk signer list`**: print all configured signers with their kinds

  **`cdk signer set <key> <value>`**: non-interactive mutations
  (e.g. `cdk signer set defaultSigner dev-wallet`)

  **`cdk signer use <name>`**: shorthand for `cdk signer set defaultSigner <name>`

- [x] **P2.2** Register `signerToolingNamespace` in `tooling-cli/src/registry.ts`

- [x] **P2.3** `pnpm run typecheck` and `pnpm run build` pass for tooling-cli

## P3 — Update `cdk sign` to read signer config

- [x] **P3.1** In `sign-namespace.ts`, update `buildSession()`:
  - If `CFX_KEYSTORE_PATH` + `CFX_PASSPHRASE` are set: existing behaviour (env vars win)
  - If `--keystore` flag is set: existing behaviour (flag wins)
  - Otherwise: call `createSignerSessionFromConfig()` to read `.cfxdevkit/signer.json`
  - For `memory` kind: session is created, prints ephemeral warning to stderr

- [x] **P3.2** `cdk sign message "Hello"` with no env vars and a `memory` signer config:
  prints warning + signature + ephemeral address

## P4 — VS Code extension: read signer.json

- [x] **P4.1** In `helpers/state.ts`, rewrite `selectedBackend()`:
  - Try to read `.cfxdevkit/signer.json` synchronously (or use a cached value)
  - Map `SignerEntry.kind` → `KeystoreBackend`:
    `'file-keystore'` → `'file'`, `'onekey'` → `'onekey'`, `'ledger'` → `'file'` (fallback), `'memory'` → `'file'` (fallback)
  - If file missing: return `'file'` (existing behaviour)

- [x] **P4.2** In `helpers/state.ts`, update `selectedFileRef()`:
  - If signer.json has `file-keystore` default: read `service` and `account` from config
  - Fall back to existing logic if config absent

- [x] **P4.3** Add `cfxdevkit.selectSigner` command in `helpers/commands.ts`:
  - Reads signer.json signers list, shows quick-pick
  - On select: calls `writeSignerConfig` to update `defaultSigner`
  - Refreshes the tree view

- [x] **P4.4** Add "Signer: dev-wallet (file)" status bar item that opens `cfxdevkit.selectSigner`

- [x] **P4.5** `pnpm run typecheck` passes for `vscode-extension`

## P5 — MCP server signer tools

- [x] **P5.1** Create `mcp-server/src/tools/signer.ts` with tool definitions:
  - `cfxdevkit_signer_status` — no params, read-only
  - `cfxdevkit_signer_setup` — params: `{ name?, kind, path?, service?, account?, accountIndex? }`
  - `cfxdevkit_signer_use` — params: `{ name }`

- [x] **P5.2** Create `mcp-server/src/handlers/signer.ts`:
  - `status`: reads `readSignerConfig()`, returns name + kind + details; for file-keystore checks if resolvable
  - `setup`: writes signer config via `writeSignerConfig`; performs a test sign for file-keystore/memory
  - `use`: calls `writeSignerConfig` updating only `defaultSigner`

- [x] **P5.3** Update `mcp-server/src/handlers/wallet.ts`:
  - Third fallback path in `cfxdevkit_wallet_sign_message`:
    if no keystore session AND no CFX env vars → `createSignerSessionFromConfig()`
  - Include signer name in the response

- [x] **P5.4** Register signer tools in `tools/registry.ts`; add `handleSignerTool` to `server.ts`

- [x] **P5.5** Add `@cfxdevkit/signer-session` to `mcp-server/package.json` (already added in headless-signer-session change; verify)

- [x] **P5.6** `pnpm run typecheck` and `pnpm run build` pass for `mcp-server`

## P6 — Showcase `/keys/setup` wizard page

- [x] **P6.1** Create `app/keys/setup/page.tsx` — a React wizard with 3 steps:
  **Step 1 — Choose backend:**
  - "Quick memory wallet" (ephemeral, no setup, best for first-time exploration)
  - "Ledger hardware wallet"
  - "OneKey Classic S1"

  **Step 2 — Configure:**
  - Memory: just shows the eSpace address that will be generated (no input needed)
  - Ledger: shows connection instructions
  - OneKey: shows connection instructions

  **Step 3 — Confirm:**
  - Show the selected signer label and expected behaviour
  - "Save & go to demos" button → stores `{ kind, label }` to `localStorage` under
    `cfxdevkit.demoSigner`, navigates to `/keys`

- [x] **P6.2** Update the `/keys` overview page to read `localStorage.cfxdevkit.demoSigner`
  and show the current demo signer in the capability matrix header or a status chip

- [x] **P6.3** Add "Configure signer →" link on `/keys` that links to `/keys/setup`

- [x] **P6.4** `pnpm run typecheck` and `pnpm run build` pass for `showcase-public`

## P7 — Gitignore and documentation

- [x] **P7.1** Add `.cfxdevkit/signer.json` to the root `.gitignore` (the wizard already adds
  it per-project; add it to the framework root .gitignore as a safety net)

- [x] **P7.2** Update `repos/cfx-keys/packages/signer-session/README.md` with the signer.json
  config format and all env vars

- [x] **P7.3** Update `.pi/SETUP.md` with a "Signer Configuration" section that points to
  `cdk signer setup` for first-time setup

## Validate

- [x] **V.1** `cdk signer setup` creates `.cfxdevkit/signer.json` and adds it to `.gitignore`
- [x] **V.2** `cdk signer status` shows the active signer name and kind
- [x] **V.3** `cdk sign message "Hello"` with no env vars reads signer.json and signs
- [x] **V.4** `cdk sign message "Hello"` with a `memory` signer prints ephemeral warning
- [x] **V.5** VS Code extension `selectedBackend()` returns `'onekey'` when signer.json has `kind: "onekey"` default
- [x] **V.6** `cfxdevkit_signer_status` MCP tool returns config details
- [x] **V.7** `cfxdevkit_signer_setup` MCP tool writes signer.json
- [x] **V.8** Showcase `/keys/setup` page renders all 3 wizard steps
- [x] **V.9** `pnpm run typecheck` passes for all affected packages
- [x] **V.10** `cdk repo precommit` passes
