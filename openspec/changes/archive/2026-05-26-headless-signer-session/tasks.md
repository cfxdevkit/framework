## P1 — New `@cfxdevkit/signer-session` package

- [x] **P1.1** Create `repos/cfx-keys/packages/signer-session/` with `package.json`:
  - `name: "@cfxdevkit/signer-session"`
  - `dependencies: @cfxdevkit/cdk, @cfxdevkit/services, @cfxdevkit/wallet`
  - Exports: `"."` → `src/index.ts`

- [x] **P1.2** Create `src/types.ts` — `SignerSession` interface:
  ```ts
  export interface SignerSession {
    readonly kind: 'memory' | 'file-keystore' | 'onekey' | 'ledger';
    readonly label: string;
    readonly eSpace: Signer;
    readonly core?: Signer;
    dispose(): Promise<void>;
  }
  ```

- [x] **P1.3** Create `src/backends/memory.ts` — `createMemorySignerSession(input)`:
  - Accepts `{ privateKey, networkId?, coreNetworkId? }`
  - Uses `signerFromPrivateKey` for eSpace; `deriveAccount` for Core Space signer

- [x] **P1.4** Create `src/backends/file-keystore.ts` — `createFileKeystoreSignerSession(input)`:
  - Accepts `{ path?, passphrase?, ref?, accountIndex? }` (all optional, fall back to env vars)
  - Reads mnemonic via `readFileKeystoreMnemonic`
  - Derives eSpace + Core signers via `deriveAccount({ mnemonic, index: accountIndex })`
  - `signerFromPrivateKey` for eSpace; Core Space signer from derived key + `hexToBase32`
  - Reads env vars: `CFX_KEYSTORE_PATH`, `CFX_PASSPHRASE`, `CFX_KEYSTORE_SERVICE`, `CFX_KEYSTORE_ACCOUNT`

- [x] **P1.5** Create `src/backends/onekey.ts` — `createOneKeySignerSession(input)`:
  - Accepts `{ sdk, connectId, deviceId, path?, networkId? }`
  - Uses `signerFromOneKey` + `signerFromOneKeyCore`

- [x] **P1.6** Create `src/backends/ledger.ts` — `createLedgerSignerSession(input)`:
  - Accepts `{ transport, espaceChainId?, coreNetworkId? }`
  - Uses `createLedgerHardwareAdapter` for eSpace and Core
  - `dispose` closes the transport

- [x] **P1.7** Create `src/index.ts` — `createSignerSession(input)` dispatcher:
  ```ts
  export async function createSignerSession(input: SignerSessionInput): Promise<SignerSession>
  ```
  Routes by `input.kind` to the appropriate backend.

- [x] **P1.8** Add package to `pnpm-workspace.yaml` glob (`repos/cfx-keys/packages/*`)

- [x] **P1.9** `pnpm run typecheck` and `pnpm run test` pass

## P2 — `cdk sign` namespace in tooling-cli

- [x] **P2.1** Create `infra/tooling-cli/src/sign-namespace.ts`:
  - Command: `sign message <msg> [--keystore <path>] [--account <name>] [--space espace|core] [--json]`
  - Command: `sign typed-data <json-file> [--space espace|core] [--json]`
  - Both: read credentials from env vars (no interactive prompt); call `createSignerSession`
  - Print: `{ signature, signer, space }` as JSON or plain text

- [x] **P2.2** Register `signToolingNamespace` in `tooling-cli/src/registry.ts`

- [x] **P2.3** Add `@cfxdevkit/signer-session` to `tooling-cli/package.json` deps

- [x] **P2.4** `pnpm run typecheck` passes for `tooling-cli`

## P3 — MCP offline fallback

- [x] **P3.1** In `mcp-server/src/handlers/wallet.ts`, case `cfxdevkit_wallet_sign_message`:
  - After the devnode-server call fails (catch block), check if `CFX_PASSPHRASE` and
    `CFX_KEYSTORE_PATH` are set
  - If yes: create a session via `createSignerSession({ kind: 'file-keystore' })`
    and sign with `session.eSpace.signMessage`
  - Include `"note": "signed offline via file keystore (devnode-server unavailable)"` in response

- [x] **P3.2** Add `@cfxdevkit/signer-session` to `mcp-server/package.json` deps

- [x] **P3.3** `pnpm run typecheck` passes for `mcp-server`

## P4 — Documentation

- [x] **P4.1** Create `repos/cfx-keys/packages/signer-session/README.md` with:
  - All four backends with code examples
  - Env var reference table
  - `cdk sign` CLI usage
  - Note on MCP offline mode

## Validate

- [x] **V.1** `createSignerSession({ kind: 'memory', privateKey: '0x...' })` returns a session
  whose `eSpace.signMessage('hello')` produces a valid 65-byte hex signature
- [x] **V.2** `createSignerSession({ kind: 'file-keystore', path, passphrase, ref })` works
  end-to-end (needs a fixture keystore in tests)
- [x] **V.3** Wrong passphrase throws with code `services/keystore/bad-passphrase`
- [x] **V.4** `cdk sign message "Hello"` with env vars set prints a hex signature and exits 0
- [x] **V.5** `cdk sign message "Hello"` without env vars prints usage error and exits 1
- [x] **V.6** `pnpm run typecheck` passes for `signer-session`, `tooling-cli`, `mcp-server`
- [x] **V.7** `pnpm run test` passes for `signer-session`
- [x] **V.8** `cdk repo precommit` passes
