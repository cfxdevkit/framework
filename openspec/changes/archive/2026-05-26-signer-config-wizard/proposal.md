## Why

Every signer entry point in the framework hardcodes "file keystore, account 0":

| Surface | Hardcoded default | Configurable? |
|---|---|---|
| VS Code extension | `selectedBackend()` **always returns `'file'`** — constant, ignores state | ❌ |
| MCP `cfxdevkit_wallet_sign_message` | File keystore via `getKeystoreSession()` | ❌ |
| `cdk sign` (tooling-cli) | Reads raw `CFX_PASSPHRASE` / `CFX_KEYSTORE_PATH` env vars | env-var only |
| Showcase demo panels | Each panel independently asks for connection | no persistence |

There is no equivalent of `providers.json` for signers. A developer using the framework
for the first time has no guided path to set up their signing identity — whether that's
a quick ephemeral key for testing, an encrypted file keystore for dev work, or a
hardware wallet for production-like scenarios.

The gap is: **no signer config file, no setup wizard, no framework-wide signer resolution**.

## What Changes

Introduce `.cfxdevkit/signer.json` as the signer configuration file (parallel to
`.pi/providers.json` for LLM config). Every surface that needs a signer reads from this
file and falls back to sensible defaults.

**`.cfxdevkit/signer.json` schema:**
```json
{
  "defaultSigner": "dev-wallet",
  "signers": {
    "dev-wallet": {
      "kind": "file-keystore",
      "path": ".cfxdevkit/keystore.json",
      "service": "cfxdevkit",
      "account": "deployer",
      "accountIndex": 0
    },
    "quick": {
      "kind": "memory"
    },
    "hardware": {
      "kind": "onekey"
    }
  }
}
```

**Five changes across the framework:**

### 1 — `@cfxdevkit/signer-session` — config layer
New exports: `readSignerConfig()`, `writeSignerConfig()`, `createSignerSessionFromConfig(name?)`.
Config lives at `.cfxdevkit/signer.json` in the repo root (resolved via `findWorkspaceRoot`).

### 2 — tooling-cli — `cdk signer` namespace + wizard
```
cdk signer setup               # interactive wizard (inquirer prompts)
cdk signer status              # show active signer, resolved addresses
cdk signer list                # show all configured signers
cdk signer set <key> <value>   # non-interactive config mutation
cdk signer use <name>          # change defaultSigner
```

`cdk sign message <msg>` automatically reads signer config when no env vars are set.

### 3 — VS Code extension — fix `selectedBackend` + signer picker
Fix `selectedBackend()` to read from `.cfxdevkit/signer.json` instead of hardcoding `'file'`.
Add `selectSignerCommand`: a VS Code quick-pick over configured signers (like the existing
network/space picker). When a hardware signer is selected, the extension connects to the device.

### 4 — MCP server — `cfxdevkit_signer_*` tools
```
cfxdevkit_signer_status   — show current config and resolved session info
cfxdevkit_signer_setup    — LLM-friendly guided setup wizard (step-by-step)
cfxdevkit_signer_use      — switch the active signer by name
```

`cfxdevkit_wallet_sign_message` reads signer config as its credential source when
`getKeystoreSession()` is null and env vars are absent.

### 5 — Showcase — `/keys/setup` page
A browser-based wizard that guides through signer selection for the demo pages.
Stores choice in `localStorage` (demo only — no real credentials persisted in browser).
Used by memory panel (just pick an account index), Ledger, and OneKey panels.

## Capabilities

### New Capabilities
- `signer-config-layer`: `readSignerConfig()`, `writeSignerConfig()`, `createSignerSessionFromConfig()` in `@cfxdevkit/signer-session`
- `cdk-signer-namespace`: `cdk signer setup|status|list|set|use` commands
- `showcase-signer-setup`: `/keys/setup` browser wizard page
- `mcp-signer-tools`: `cfxdevkit_signer_status|setup|use` MCP tools

### Modified Capabilities
- `vscode-signer-backend`: `selectedBackend()` reads signer.json; add quick-pick command
- `tooling-cli-sign`: `cdk sign` falls back to signer.json when no env vars set
- `mcp-sign`: `cfxdevkit_wallet_sign_message` falls back to signer.json

## Impact

- `repos/cfx-keys/packages/signer-session/src/config.ts` — new: config R/W + session-from-config
- `repos/cfx-tools/infra/tooling-cli/src/signer-namespace.ts` — new: `cdk signer` commands
- `repos/cfx-tools/infra/tooling-cli/src/sign-namespace.ts` — update: read signer config fallback
- `repos/cfx-tools/packages/vscode-extension/src/helpers/state.ts` — fix: `selectedBackend()`
- `repos/cfx-tools/packages/vscode-extension/src/helpers/commands.ts` — add: signer picker command
- `repos/cfx-tools/packages/mcp-server/src/tools/signer.ts` — new: signer MCP tools
- `repos/cfx-tools/packages/mcp-server/src/handlers/signer.ts` — new: handler
- `repos/cfx-tools/packages/mcp-server/src/tools/registry.ts` — register signer tools
- `projects/examples/apps/showcase-public/app/keys/setup/page.tsx` — new: wizard page
- `.cfxdevkit/signer.json` — created by wizard at first use; gitignore entry added
