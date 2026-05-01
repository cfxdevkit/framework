# Keystore Session Provider

## Purpose

`KeystoreSessionProvider` is the single control plane for mnemonic-root
availability, wallet selection, keystore unlock state, and signer alignment. Any
operation that can sign, start a local node, deploy a contract, issue a session
key, or talk to a wallet-bound client must go through this provider instead of
building its own signer from a mnemonic or private key.

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
  mnemonicRoots: readonly StoredSecret[];
  derivedAccounts: readonly DerivedAccount[];
  activeMnemonicRef: SecretRef | null;
  activeAccountIndex: number | null;
  activeSigner: Signer | null;
  sessionId: string;
  error: KeystoreSessionError | null;
}
```

`sessionId` changes whenever the active backend, active network, active
mnemonic root, active derived account, unlock state, or capability set changes.
Feature code must include `sessionId` in memoization, query keys, and effect
dependencies so stale work is naturally discarded.

## Required Use Cases

The first implementation should centralize these operations:

| Use case | Required behavior |
|----------|-------------------|
| `configureBackend` | Select file, OS, KMS, forwarded, or memory-test backend from environment/config. |
| `unlock` | Prompt through an injected secret source; never store passphrases in React state or logs. |
| `lock` | Drop cached KEKs/signers, clear active signer, invalidate `sessionId`, abort wallet-bound work. |
| `listMnemonicRoots` | Return metadata only; no secret material and no private-key export path. |
| `selectMnemonicRoot` | Validate the root exists, clear stale derived-account state, and invalidate clients. |
| `selectDerivedAccount` | Derive a signer through `provider.getSigner(rootRef, capability, { derivationPath })`, bind network capability, then invalidate clients. |
| `addMnemonicRoot` | Import or create a mnemonic root only through explicit user action; reject silent overwrites unless a replace flag is confirmed. |
| `removeMnemonicRoot` | Refuse to remove the active mnemonic root unless the caller also selects another root or disconnects. |
| `updateDerivedAccounts` | Maintain count/path metadata for relative accounts under the selected mnemonic root. |
| `rotatePassphrase` | Re-encrypt, force all old provider instances to lock, and require a fresh unlock. |
| `resetClients` | Abort in-flight wallet-bound operations and rebuild any client wrappers that capture signer/session state. |

## Security Invariants

- Private keys and mnemonics never cross the provider boundary after import or
  creation. Feature panels receive `Signer`, addresses, and metadata only.
- Passphrases are obtained through an injected prompt/secret provider and are
  never placed in URL params, localStorage, sessionStorage, logs, or long-lived
  component state.
- The keystore stores mnemonic roots as first-class secrets. Derived accounts are
  relative children selected by derivation path; they are not independent
  keystore wallets.
- The selected network is part of the signer capability. Mainnet/testnet/local
  chain IDs come from the central network selection, not free-form UI fields.
- Mainnet write operations require an explicit confirmation policy and should
  prefer hardware/KMS-backed wallets over file-backed wallets.
- Removing or rotating secrets invalidates the active session immediately.
- Every mutating operation emits an audit event with action, backend, ref,
  network, result, and error code, but never key material or passphrases.
- `keystore-memory` is allowed only in tests and demos that clearly opt in.
- The devnode may use only the selected local mnemonic root or a root created by
  the provider for local development; it must not bypass session state with a
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
- Wallet-bound clients/actions: reset on network, space, active mnemonic root,
  active derived account, capability, lock, unlock, or backend changes.

Panels that deploy, sign, issue session keys, bridge, or start local nodes must
depend on `KeystoreSession.sessionId`. If a session changes while an operation
is running, the operation should be aborted or its result ignored.

## UI Contract

A global status menu should be available before node controls or feature panels
can perform sensitive actions. It should show:

- backend status: unconfigured, locked, ready, or error;
- active network and capability scope;
- active mnemonic label/ref and active derived account address/path;
- mnemonic-root list with select/remove actions;
- derived account list with select actions;
- add/import/create mnemonic-root actions;
- lock/unlock and rotate passphrase actions when supported by the backend.

Feature panels should render read-only information when locked and request the
provider to unlock/select a mnemonic root and derived account before enabling
signing or node lifecycle actions.

## Implementation Phases

Current status: the showcase app has an in-memory `KeystoreSessionProvider`
with mnemonic-root add, select, remove, reset, derived-account selection, sign,
session ID, network capability, and local devnode seed alignment flows. The VS
Code extension has the same control-plane shape for its encrypted file backend:
select keystore file, add generated/imported mnemonic roots, select an active
derived account under the active root, remove roots, lock/unlock, rotate
password, and route local/remote writes through the active mnemonic account.
These are demo/workspace implementations and do not replace the OS or KMS
backend work below.

1. Add provider state/types and tests in the UI/session package without changing
   backend encryption code.
2. Replace showcase mnemonic signer state with `KeystoreSessionProvider`.
3. Move the keystore panel from a backend demo to a real wallet/session manager.
4. Gate devnode start/restart/wipe behind the selected local keystore session.
5. Add extension parity for file-keystore wallet maintenance.
6. Add OS/KMS backend session wiring and invalidate stale KEK caches.
7. Add audit tests for add root, remove root, select root, select derived
  account, lock, unlock, rotate, and network changes.

## Non-Goals

- The provider does not implement encryption itself; it delegates to
  `KeystoreProvider` backends.
- The provider does not expose private-key export as a normal use case.
- The provider does not make browser localStorage a trusted key store.