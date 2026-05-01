# framework/services — Public API

> Pluggable backends behind a single interface. Backends are independent sub-paths.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/services/keystore` | `KeystoreProvider` interface + types |
| `@cfxdevkit/services/keystore-kms` | KMS / Vault / Ledger backend |
| `@cfxdevkit/services/keystore-os` | OS keyring backend (`@napi-rs/keyring`) |
| `@cfxdevkit/services/keystore-file` | Encrypted file backend (AES-GCM + Argon2id) |
| `@cfxdevkit/services/keystore-forward` | Forward host keyring socket into container |
| `@cfxdevkit/services/keystore-memory` | Tests-only |
| `@cfxdevkit/services/crypto` | AES-GCM, KDF, CSPRNG, encoding |
| `@cfxdevkit/services/dex` | `DexAdapter` interface |
| `@cfxdevkit/services/dex/swappi` | Swappi adapter |
| `@cfxdevkit/services/tokens` | Token metadata service |

---

## `services/keystore` — interface

```
type SecretRef = { service: string; account: string }

type Capability = {
  chains?: ChainId[]
  contracts?: Address[]
  selectors?: Hex[]
  maxValuePerTx?: Wei
  notAfter?: Timestamp
}

type StoredSecret = {
  ref: SecretRef
  kind: 'private-key' | 'mnemonic' | 'opaque'
  createdAt: Timestamp
  meta?: Record<string, string>     // never private content
}

type KeystoreProvider = {
  readonly id: string                // e.g. "kms-aws", "os", "file"
  readonly capabilities: { write: boolean; list: boolean; rotate: boolean }

  list(opts?: { service?: string; signal?: AbortSignal }): Promise<StoredSecret[]>
  has(ref: SecretRef, opts?: { signal?: AbortSignal }): Promise<boolean>

  // Returns a Signer bound to the secret. Private material never crosses the boundary.
  getSigner(ref: SecretRef, capability?: Capability, opts?: { signal?: AbortSignal; derivationPath?: string }): Promise<Signer>

  // Write operations. Optional per backend (e.g. KMS may forbid put).
  put?(input: { ref: SecretRef; kind: StoredSecret['kind']; secret: Hex | string; meta?: Record<string, string> }, opts?: { signal?: AbortSignal; derivationPath?: string }): Promise<void>
  updateMeta?(ref: SecretRef, meta: Record<string, string>, opts?: { signal?: AbortSignal; derivationPath?: string }): Promise<void>
  remove?(ref: SecretRef, opts?: { signal?: AbortSignal }): Promise<void>
  rotate?(ref: SecretRef, opts?: { signal?: AbortSignal }): Promise<{ ref: SecretRef }>
}

type AuditLogger = { record(entry: { at: Timestamp; provider: string; action: string; ref?: SecretRef; ok: boolean; meta?: Record<string, unknown> }): void }

const noopAuditLogger: AuditLogger
function createFileAuditLogger(path: string): AuditLogger
```

### Errors
`KeystoreError` with codes `services/keystore/{locked,not-found,bad-passphrase,backend-unavailable,unsupported}`.

### Rules
- A backend MUST NOT log secret material.
- A backend MUST validate `Capability` server-side before signing if it supports
  capability-scoped signers.
- All backends are constructed via a `create*` factory; no module singletons.

---

## `services/keystore-kms`

```
function createAwsKmsKeystore(opts: { region: string; keyArns: Record<string, string>; client?: AwsKmsClient; audit?: AuditLogger }): KeystoreProvider
function createGcpKmsKeystore(opts: { project: string; locationId: string; keyRing: string; audit?: AuditLogger }): KeystoreProvider
function createVaultKeystore(opts: { endpoint: string; mount: string; token: () => Promise<string>; audit?: AuditLogger }): KeystoreProvider
function createLedgerKeystore(opts: { transport: () => Promise<LedgerTransport>; audit?: AuditLogger }): KeystoreProvider
```

All return objects implementing `KeystoreProvider`. KMS variants disable `put` /
`remove` by default (the cloud key never leaves the cloud).

---

## `services/keystore-os`

```
function createOsKeystore(opts?: { service?: string; audit?: AuditLogger }): KeystoreProvider
function isOsKeystoreAvailable(): boolean       // returns false in containers without keyring
```

Wraps `@napi-rs/keyring`. Returns `KeystoreError code "backend-unavailable"` from
factory if the OS keyring is not present.

---

## `services/keystore-file`

```
type FileKeystoreOptions = {
  path: string                      // file location
  unlock: () => Promise<{ passphrase: string }>     // user-supplied prompt
  format?: 'cfx-v1' | 'sops-age'    // default 'cfx-v1'
  audit?: AuditLogger
}

function createFileKeystore(opts: FileKeystoreOptions): KeystoreProvider

function initFileKeystore(input: { path: string; passphrase: string }): Promise<void>
function changeFilePassphrase(input: { path: string; oldPassphrase: string; newPassphrase: string }): Promise<void>
function exportToSops(input: { srcPath: string; destPath: string; ageRecipients: string[] }): Promise<void>
function importFromSops(input: { srcPath: string; destPath: string; passphrase: string }): Promise<void>
```

On-disk format spec lives in `src/keystore/file/format.ts`; versioned + documented.

---

## `services/keystore-forward`

```
function createForwardedKeystore(opts: {
  socketPath: string                // e.g. /run/user/1000/keyring/control
  protocol: 'libsecret' | 'ssh-agent'
  audit?: AuditLogger
}): KeystoreProvider
```

Container reads from a host-mounted socket. `getSigner` round-trips to the host;
private material never enters the container.

---

## `services/keystore-memory`

```
function createMemoryKeystore(opts?: { seed?: Array<{ ref: SecretRef; privateKey: Hex }> }): KeystoreProvider
```

Tests only. Throws if imported in non-test build (guarded by `process.env.NODE_ENV`
detection at module top).

---

## `services/crypto`

```
type AesGcmKey = Uint8Array & { length: 32 }      // branded

function generateAesGcmKey(): AesGcmKey
function encryptAesGcm(input: { key: AesGcmKey; plaintext: Uint8Array; aad?: Uint8Array }): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; tag: Uint8Array }>
function decryptAesGcm(input: { key: AesGcmKey; ciphertext: Uint8Array; iv: Uint8Array; tag: Uint8Array; aad?: Uint8Array }): Promise<Uint8Array>

function deriveKeyArgon2id(input: { passphrase: string; salt: Uint8Array; memKiB?: number; iterations?: number; parallelism?: number }): Promise<AesGcmKey>
function deriveKeyHkdf(input: { ikm: Uint8Array; salt?: Uint8Array; info?: Uint8Array; length?: number }): Promise<Uint8Array>

function randomBytes(n: number): Uint8Array
function toBase64Url(bytes: Uint8Array): string
function fromBase64Url(text: string): Uint8Array
function toHex(bytes: Uint8Array): Hex
function fromHex(hex: Hex): Uint8Array
```

Errors: `CryptoError` with codes `services/crypto/{decrypt-failed,bad-key}`.

---

## `services/dex` — interface

```
type Quote = {
  amountIn: Wei
  amountOut: Wei
  route: Address[]
  priceImpactBps: number
  validUntil: Timestamp
}

type SwapInput = {
  client: Client
  signer: Signer
  amountIn: Wei
  tokenIn: Address
  tokenOut: Address
  recipient: Address
  slippageBps: number
  deadline: Timestamp
  signal?: AbortSignal
}

type DexAdapter = {
  readonly id: string
  quote(input: { client: Client; tokenIn: Address; tokenOut: Address; amountIn: Wei; signal?: AbortSignal }): Promise<Quote>
  swap(input: SwapInput): Promise<{ hash: Hash }>
}
```

`services/dex/swappi`:
```
function createSwappiAdapter(opts: { router?: Address; factory?: Address }): DexAdapter
```

Errors: `DexError` with codes `services/dex/{no-route,slippage,insufficient-liquidity}`.

---

## `services/tokens`

```
type TokenInfo = { address: Address; symbol: string; name: string; decimals: number; logoUri?: string; chainId: ChainId }

function createTokenRegistry(opts: { catalog?: TokenInfo[]; client?: Client }): {
  byAddress(chainId: ChainId, address: Address, opts?: { signal?: AbortSignal }): Promise<TokenInfo | null>
  bySymbol(chainId: ChainId, symbol: string): TokenInfo | null
  list(chainId: ChainId): readonly TokenInfo[]
}
```

If `client` is provided, unknown tokens are resolved on-chain (ERC-20 metadata) and
cached in memory only.
