## Why

Signing a message or transaction programmatically — without a browser UI, without a running
devnode-server, without an interactive prompt — is currently not possible through a clean API.

Use cases that need this today:

| Caller | Need |
|---|---|
| `cdk sign message "Hello"` (tooling-cli) | Sign from file keystore via env passphrase |
| MCP `cfxdevkit_wallet_sign_message` | Sign without devnode-server running |
| VS Code extension pre-sign (tests) | Sign during CI test setup |
| Automated deploy scripts | Sign contract deployment tx from keystore |
| OneKey hardware in terminal workflow | Sign via hardware without opening a browser |

The building blocks exist: `signerFromPrivateKey`, `readFileKeystoreMnemonic`,
`signerFromLedger`, `signerFromOneKey`. What is missing is a single **factory** that
accepts a backend descriptor + credentials and returns a pair of ready `Signer` objects
(eSpace + optionally Core), fully typed, for immediate use.

## What Changes

**New package or module: `@cfxdevkit/signer-session`** (or a new export group in
`@cfxdevkit/services`) with `createSignerSession(input)`:

```ts
// Memory / private key (dev/test)
const s = await createSignerSession({ kind: 'memory', privateKey: '0x...' });

// File keystore + mnemonic (no UI)
const s = await createSignerSession({
  kind: 'file-keystore',
  path: '~/.cfxdevkit/keystore.json',
  passphrase: process.env.CFX_PASSPHRASE,
  ref: { service: 'cfxdevkit', account: 'deployer' },
  accountIndex: 0,
});

// OneKey hardware (Node.js / Electron, not browser)
const s = await createSignerSession({
  kind: 'onekey',
  connectId: 'XXXX',
  deviceId: 'YYYY',
  sdk: HardwareSDK,
});

// Ledger hardware (Node.js HID)
const s = await createSignerSession({
  kind: 'ledger',
  transport: await createNodeHidLedgerTransport(),
});

// Resulting session:
s.eSpace.signMessage('hello');      // eSpace Signer
s.core?.signMessage('hello');       // Core Signer (if supported by backend)
s.kind;                              // 'memory' | 'file-keystore' | 'onekey' | 'ledger'
s.label;                             // human-readable, e.g. 'deployer @ cfxdevkit'
s.dispose();                         // close transport / clear keys
```

**Wire `createSignerSession` into:**
- **tooling-cli**: new `cdk sign` namespace (`sign message`, `sign typed-data`)
- **MCP server**: `cfxdevkit_wallet_sign_message` falls back to `createSignerSession`
  when devnode-server is not running (checks for `CFX_PASSPHRASE` + `CFX_KEYSTORE_PATH`)

## Capabilities

### New Capabilities
- `signer-session`: `createSignerSession(input): Promise<SignerSession>` — unified headless
  signer factory covering memory, file-keystore, OneKey, and Ledger backends.

### Modified Capabilities
- `tooling-cli-sign`: new `cdk sign` commands using `createSignerSession`
- `mcp-sign`: `cfxdevkit_wallet_sign_message` falls back to env-based `createSignerSession`

## Impact

- `repos/cfx-keys/packages/services/src/signer-session.ts` — new file (or new package)
- `repos/cfx-tools/infra/tooling-cli/src/sign-namespace.ts` — new namespace
- `repos/cfx-tools/packages/mcp-server/src/handlers/wallet.ts` — add env fallback
- No breaking changes to existing APIs
