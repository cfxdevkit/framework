## Context

`@cfxdevkit/services` already contains everything needed:
- `readFileKeystoreMnemonic({ path, passphrase, ref })` → mnemonic string
- `signerFromSecret(rec, secret, path)` → `Signer` (internal, used by `createFileKeystore`)

`@cfxdevkit/cdk/wallet`:
- `signerFromPrivateKey(privateKey, networkId)` → `Signer`
- `deriveAccount({ mnemonic, index })` → `{ privateKey, evmAddress, coreAddress }`

`@cfxdevkit/wallet/hardware/onekey`:
- `signerFromOneKey(input)` → eSpace `Signer`
- `signerFromOneKeyCore(input)` → Core `Signer`

`@cfxdevkit/wallet/hardware/ledger`:
- `signerFromLedger({ family: 'espace', ... })` → eSpace `Signer`
- `signerFromLedger({ family: 'core', ... })` → Core `Signer`

The factory `createSignerSession` composes these building blocks into a unified result.

## Goals / Non-Goals

**Goals:**
- Single `createSignerSession` call returns `{ eSpace, core?, kind, label, dispose }`
- Works in Node.js (tooling-cli, MCP, VS Code extension) without a browser
- File-keystore path supports env vars `CFX_PASSPHRASE` / `CFX_KEYSTORE_PATH` / `CFX_KEYSTORE_ACCOUNT`
- `cdk sign message <msg>` and `cdk sign typed-data <json>` commands
- MCP `cfxdevkit_wallet_sign_message` can work offline (no devnode-server) via env vars

**Non-Goals:**
- Browser-based signing UI (that's the showcase)
- OneKey browser SDK (`hd-web-sdk`) — headless uses `hd-common-connect-sdk` in Node
- Session key delegation or capability policies (future)
- Interactive passphrase prompts (always read from env or passed explicitly)

## Decisions

**`createSignerSession` lives in `@cfxdevkit/services`** as a new export group
`services/signer-session`. It imports from `cdk/wallet`, `wallet/hardware/ledger`, and
`wallet/hardware/onekey` — all already in the dep graph of services consumers.

**`SignerSession.dispose()` is a no-op for memory/file, closes transport for hardware.**
Callers should always call `dispose()` in a `finally` block.

**Env-var convention (file-keystore):**
| Env var | Purpose |
|---|---|
| `CFX_KEYSTORE_PATH` | Path to the encrypted JSON keystore file |
| `CFX_PASSPHRASE` | Passphrase to decrypt the keystore |
| `CFX_KEYSTORE_SERVICE` | `ref.service` (default: `"cfxdevkit"`) |
| `CFX_KEYSTORE_ACCOUNT` | `ref.account` (default: `"default"`) |

**`cdk sign` namespace in tooling-cli:**
```
cdk sign message <msg> [--keystore <path>] [--account <name>] [--space espace|core]
cdk sign typed-data <json-file> [--keystore <path>] [--space espace|core]
```
Reads passphrase from `CFX_PASSPHRASE` env var; never prompts interactively
(interactive use goes through `cdk agent chat`).

**MCP fallback:** If `devnode-server` is unreachable AND `CFX_PASSPHRASE` + `CFX_KEYSTORE_PATH`
are both set, `cfxdevkit_wallet_sign_message` creates a short-lived session directly.
This does NOT affect the normal path (devnode-server running).

## Risks / Trade-offs

- `@cfxdevkit/services` gains a dependency on `@cfxdevkit/wallet` (for hardware adapters).
  Check if this creates a cycle — `wallet` depends on `services` (for `KeystoreProvider`).
  **Mitigation:** keep `createSignerSession` in a new sibling package
  `@cfxdevkit/signer-session` that depends on both, avoiding the cycle.
- Passphrase in env var is a common and acceptable pattern for CI/automated scripts;
  document clearly that this is for non-interactive use only.
