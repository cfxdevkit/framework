# Keystore Session Provider

## Purpose

`KeystoreSessionProvider` is the single control plane for wallet availability,
wallet selection, keystore unlock state, and signer alignment. Any operation
that can sign, start a local node, deploy a contract, issue a session key, or
talk to a wallet-bound client must go through this provider instead of building
its own signer from a mnemonic or private key.

The goal is to make key handling auditable: one path to monitor, one set of
state transitions to test, and one place where security policy is enforced.

## Ownership Boundary

The provider belongs at the application/session layer, above raw keystore
backends and below feature panels or tools:

```
UI panels / CLI commands / devnode controls
              |
              v
      KeystoreSessionProvider
              |
              v
 @cfxdevkit/services KeystoreProvider backends
              |
              v
      file / OS / KMS / forwarded / memory-test
```

Consumers receive a `KeystoreSession`, not a backend. Direct backend imports are
reserved for provider construction, tests, and backend-specific setup tools.

## Session State

The provider exposes explicit state rather than implicit booleans:

```ts
type KeystoreSessionStatus =
  | 'unconfigured'
  | 'locked'
  | 'unlocking'
  | 'ready'
  | 'switching-wallet'
  | 'error';

interface KeystoreSession {
  status: KeystoreSessionStatus;
  backendId: string;
  networkId: 'mainnet' | 'testnet' | 'local';
  chainIds: readonly number[];
  wallets: readonly StoredSecret[];
  activeRef: SecretRef | null;
  activeSigner: Signer | null;
  sessionId: string;
  error: KeystoreSessionError | null;
}
```

`sessionId` changes whenever the active backend, active network, active wallet,
unlock state, or capability set changes. Feature code must include `sessionId`
in memoization, query keys, and effect dependencies so stale work is naturally
discarded.

## Required Use Cases

The first implementation should centralize these operations:

| Use case | Required behavior |
|----------|-------------------|
| `configureBackend` | Select file, OS, KMS, forwarded, or memory-test backend from environment/config. |
| `unlock` | Prompt through an injected secret source; never store passphrases in React state or logs. |
| `lock` | Drop cached KEKs/signers, clear active signer, invalidate `sessionId`, abort wallet-bound work. |
| `listWallets` | Return metadata only; no secret material and no private-key export path. |
| `selectWallet` | Validate the wallet exists, derive a signer through `provider.getSigner`, bind network capability, then invalidate clients. |
| `addWallet` | Import or create a wallet only through explicit user action; reject silent overwrites unless a replace flag is confirmed. |
| `removeWallet` | Refuse to remove the active wallet unless the caller also selects another wallet or disconnects. |
| `rotatePassphrase` | Re-encrypt, force all old provider instances to lock, and require a fresh unlock. |
| `resetClients` | Abort in-flight wallet-bound operations and rebuild any client wrappers that capture signer/session state. |

## Security Invariants

- Private keys and mnemonics never cross the provider boundary after import or
  creation. Feature panels receive `Signer`, addresses, and metadata only.
- Passphrases are obtained through an injected prompt/secret provider and are
  never placed in URL params, localStorage, sessionStorage, logs, or long-lived
  component state.
- The selected network is part of the signer capability. Mainnet/testnet/local
  chain IDs come from the central network selection, not free-form UI fields.
- Mainnet write operations require an explicit confirmation policy and should
  prefer hardware/KMS-backed wallets over file-backed wallets.
- Removing or rotating secrets invalidates the active session immediately.
- Every mutating operation emits an audit event with action, backend, ref,
  network, result, and error code, but never key material or passphrases.
- `keystore-memory` is allowed only in tests and demos that clearly opt in.
- The devnode may use only the selected local session or a wallet created by the
  provider for local development; it must not bypass session state with a
  hard-coded mnemonic.

## Network Alignment

Network selection owns the allowed chain set:

| Network | Allowed chain IDs |
|---------|-------------------|
| `mainnet` | Core `1029`, eSpace `1030` |
| `testnet` | Core `1`, eSpace `71` |
| `local` | Core `2029`, eSpace `2030` |

When the network changes, the provider must rebuild the active signer with the
new capability or clear it if the backend cannot support the new network. All
wallet-bound clients and panels observe a new `sessionId`.

## Client Reset Model

Clients should be split into two categories:

- Read-only network clients: reset on network or transport changes.
- Wallet-bound clients/actions: reset on network, space, active wallet,
  capability, lock, unlock, or backend changes.

Panels that deploy, sign, issue session keys, bridge, or start local nodes must
depend on `KeystoreSession.sessionId`. If a session changes while an operation
is running, the operation should be aborted or its result ignored.

## UI Contract

A global status menu should be available before node controls or feature panels
can perform sensitive actions. It should show:

- backend status: unconfigured, locked, ready, or error;
- active network and capability scope;
- active wallet label/address/ref;
- wallet list with select/remove actions;
- add/import/create wallet actions;
- lock/unlock and rotate passphrase actions when supported by the backend.

Feature panels should render read-only information when locked and request the
provider to unlock/select a wallet before enabling signing or node lifecycle
actions.

## Implementation Phases

Current status: the showcase app has an initial in-memory
`KeystoreSessionProvider` that centralizes wallet selection, session IDs,
network capability, and local devnode seed alignment. It is a browser/demo
implementation and does not replace the encrypted file, OS, or KMS backend work
below.

1. Add provider state/types and tests in the UI/session package without changing
   backend encryption code.
2. Replace showcase mnemonic signer state with `KeystoreSessionProvider`.
3. Move the keystore panel from a backend demo to a real wallet/session manager.
4. Gate devnode start/restart/wipe behind the selected local keystore session.
5. Add lock/rotation support to the file backend and invalidate stale KEK caches.
6. Add audit tests for add, remove, select, lock, unlock, rotate, and network
   changes.

## Non-Goals

- The provider does not implement encryption itself; it delegates to
  `KeystoreProvider` backends.
- The provider does not expose private-key export as a normal use case.
- The provider does not make browser localStorage a trusted key store.