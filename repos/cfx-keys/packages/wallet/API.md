# @cfxdevkit/wallet — Public API

> The **only blessed entrypoint for automated signers**. Raw private keys go
> through `services/keystore` first; this package wraps them into capability-scoped
> session keys.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/wallet/session-key` | session-key lifecycle (issue, sign, rotate, revoke) |
| `@cfxdevkit/wallet/batched` | nonce manager, multicall/multisend wrappers |
| `@cfxdevkit/wallet/signers` | signer factories (from-keystore, from-hardware, readonly) |
| `@cfxdevkit/wallet/policies` | reusable policy presets for capabilities |
| `@cfxdevkit/wallet/errors` | `SessionKeyError` |
| `@cfxdevkit/wallet/hardware` | shared hardware wallet adapter types; supported kinds: Ledger, OneKey, Satochip |
| `@cfxdevkit/wallet/hardware/ledger` | direct Ledger hardware adapter over the services Ledger signer |
| `@cfxdevkit/wallet/hardware/onekey` | direct OneKey hardware adapter |
| `@cfxdevkit/wallet/hardware/satochip` | Satochip local bridge adapter |

---

## `wallet/session-key`

### Concept
A session key is an ephemeral keypair, **derived in memory**, that signs only
within a stated `Capability` and `notAfter` deadline. It is signed/authorised by
a parent `Signer` so the chain (or off-chain verifier) can validate it.

### Public surface
```
type SessionKey = {
  publicKey: Hex
  address: Address
  capability: Capability
  issuedAt: Timestamp
  notAfter: Timestamp
  parent: Address                   // who authorised it
  attestation: Hex                  // parent signature over (publicKey, capability, notAfter)
}

type SessionSigner = Signer & {
  readonly sessionKey: SessionKey
  isExpired(now?: Timestamp): boolean
  remainingMs(now?: Timestamp): DurationMs
}

function issueSessionKey(input: {
  parent: Signer                    // long-lived signer (from keystore/HW)
  capability: Capability
  ttlMs: DurationMs
  clock?: () => Timestamp           // injectable
}): Promise<SessionSigner>

function rotateSessionKey(input: {
  current: SessionSigner
  parent: Signer
  ttlMs: DurationMs
  clock?: () => Timestamp
}): Promise<SessionSigner>

function revokeSessionKey(input: {
  client: Client                    // for on-chain revocation if a registry contract is configured
  session: SessionKey
  parent: Signer
  registry?: Address
}): Promise<{ hash?: Hash }>

function verifyAttestation(input: { session: SessionKey; expectedParent: Address }): boolean
```

### Errors
`SessionKeyError` codes:
- `wallet/session-key/expired`
- `wallet/session-key/capability-denied`  — call attempted outside capability
- `wallet/session-key/revoked`
- `wallet/session-key/bad-attestation`

### Internal storage
Session keys live in **process memory only**. They are never persisted by this
package. If a project wants persistence, it must explicitly re-issue on startup.

---

## `wallet/signers`

```
function signerFromKeystore(input: {
  provider: KeystoreProvider
  ref: SecretRef
  capability?: Capability
}): Promise<Signer>

function signerFromHardware(input: {
  transport: () => Promise<LedgerTransport>
  derivationPath?: string
}): Promise<Signer>

function readonlySigner(address: Address): Signer    // throws on any sign* call
```

`signerFromKeystore` is the recommended starting point everywhere. It delegates
to the provider's `getSigner` so private material stays inside the backend.
Hardware signers use the same shape; Ledger support should expose both a direct
hardware adapter and a `KeystoreProvider` wrapper for deployment automation.

## `wallet/hardware/ledger`

```
function createLedgerHardwareAdapter(input: {
  eth: LedgerEthAppLike
  path?: string
  chainId?: number | string
  expectedAddress?: Address
  showAddressOnDevice?: boolean
}): HardwareWalletAdapter

function signerFromLedger(input: SignerFromLedgerInput): Promise<Signer>
function createNodeHidLedgerTransport(): Promise<LedgerTransportLike>
function createLedgerEthApp(transport: LedgerTransportLike): Promise<LedgerEthAppLike>
```

The adapter signs Conflux eSpace transactions and messages through the Ledger
Ethereum app. Core Space signing fails fast until unsigned Core transaction
serialization is available for the Conflux Ledger app APDU flow.

---

## `wallet/batched`

```
type NonceManager = {
  next(opts?: { signal?: AbortSignal }): Promise<number>
  reset(): Promise<void>
}

function createNonceManager(input: { client: Client; address: Address }): NonceManager

function multicallRead(input: {
  client: Client
  calls: readonly ReadCall[]
  blockTag?: BlockTag
  signal?: AbortSignal
}): Promise<Array<{ ok: boolean; result: unknown; error?: ContractError }>>

function multisendWrite(input: {
  client: Client
  signer: Signer
  calls: readonly WriteCall[]
  signal?: AbortSignal
}): Promise<{ hash: Hash }>
```

Wraps `core/batch` with signer + nonce concerns. `core/batch` stays signer-free.

---

## `wallet/policies`

Reusable factories that produce `Capability` objects.

```
function allowlistContracts(addresses: readonly Address[]): Partial<Capability>
function allowlistSelectors(selectors: readonly Hex[]): Partial<Capability>
function valueCap(maxPerTx: Wei): Partial<Capability>
function timeWindow(notAfter: Timestamp): Partial<Capability>
function combine(...partials: ReadonlyArray<Partial<Capability>>): Capability
```

Pure. Compose with `combine(...)`.

---

## `wallet/errors`

```
class SessionKeyError extends CfxError {}
```

Codes listed above.

---

## Anti-goals

- ❌ Persistent session-key store (project decision; see `domains/automation/persistence`).
- ❌ Wallet UI / connectors (lives in `framework/wallet-connect`).
- ❌ Mnemonic generation UX (lives in `platform/devtools/cfx-keystore`).
