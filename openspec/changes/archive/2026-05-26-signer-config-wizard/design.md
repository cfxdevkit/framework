## Context

The pattern directly mirrors how LLM config works:

```
LLM:    .pi/providers.json      → readConfig()         → resolveProvider()              → complete()
Signer: .cfxdevkit/signer.json  → readSignerConfig()   → createSignerSessionFromConfig() → sign()
```

`.cfxdevkit/` already hosts workspace-scoped runtime data: `keystore.json`, `deployments.json`,
`devnode/`, `audit.log`. Signer config belongs here — it's workspace-scoped developer
identity, not project source code.

**Config resolution order** (same as LLM config):
1. Explicit argument (`--signer <name>` flag)
2. `CFX_SIGNER_NAME` env var
3. `defaultSigner` in `.cfxdevkit/signer.json`
4. Built-in default: `memory` (ephemeral, uses a generated private key stored only in memory)

**`SignerConfig` shape:**
```ts
interface SignerConfig {
  readonly defaultSigner: string;
  readonly signers: Record<string, SignerEntry>;
}

type SignerEntry =
  | { kind: 'memory' }
  | { kind: 'file-keystore'; path?: string; service?: string; account?: string; accountIndex?: number }
  | { kind: 'onekey'; espacePath?: string; corePath?: string; espaceChainId?: number; coreNetworkId?: number }
  | { kind: 'ledger'; espaceChainId?: number; coreNetworkId?: number };
```

`memory` kind is the safe default: generates a random private key each session, prints the
eSpace address, and warns that it is ephemeral. Perfect for a first-run experience — the
developer can sign without setting up a keystore, and the warning nudges them to upgrade.

## Goals / Non-Goals

**Goals:**
- First `cdk signer setup` run produces a `.cfxdevkit/signer.json`
- `cdk sign message <msg>` with no env vars reads signer config and signs
- VS Code extension picks up the active signer from signer.json
- MCP LLM can run `cfxdevkit_signer_setup` to interactively configure signing
- Showcase `/keys/setup` wizard guides through a demo signer choice (localStorage only)
- `.cfxdevkit/signer.json` is gitignored (contains keystore paths; may contain private keys for memory kind)

**Non-Goals:**
- Storing private keys in signer.json for production use (always use file-keystore or hardware)
- Cloud KMS integration (future)
- Multi-signer transactions or multi-sig

## Decisions

**`memory` kind stores no credentials.** At session creation, a random private key is
generated and used for that session only. The address is shown; the key is never written
to disk. This is explicitly marked as "ephemeral — for testing only" in every output.

**`file-keystore` kind stores only the path + ref, never the passphrase.** The passphrase
is always read at runtime from `CFX_PASSPHRASE` env var or prompted interactively. The
signer.json is safe to commit if only `file-keystore` signers are used (no secrets).

**`onekey` / `ledger` kinds store only HD paths.** Device IDs and transport details
are resolved at runtime when the user plugs in the device.

**Wizard uses `@inquirer/prompts`** (already in tooling-cli) for the CLI wizard.
The showcase wizard is a standalone React component (no external lib).

**VS Code uses the active signer from signer.json.** When the file doesn't exist,
falls back to the current behaviour (`'file'`). A "Select Signer" status bar item shows
the active signer name and opens a quick-pick.

**MCP tool `cfxdevkit_signer_setup` is conversational.** The LLM calls it with partial
arguments; the tool responds with what's needed next. After 2-3 turns the config is written
and a test sign is performed to confirm.

## Risks / Trade-offs

- `memory` signer as default means first-run users get an ephemeral key. This is intentional
  and safe (no real funds) but must be prominently labelled.
- Signer.json with `file-keystore` entries is safe to commit (no secrets). A `memory` entry
  with a stored private key would NOT be safe — the wizard should refuse to write a private
  key to signer.json.
- Hardware signers need the device connected at session creation time. The `status` command
  should gracefully handle a disconnected device.
