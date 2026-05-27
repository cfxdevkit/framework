## ADDED Requirements

### Requirement: signer-session-factory
`createSignerSession` must return a fully initialised `SignerSession` without browser UI.

#### Scenario: memory backend
- **WHEN** `createSignerSession({ kind: 'memory', privateKey: '0x...' })` is called
- **THEN** `session.eSpace.signMessage('hello')` returns a valid hex signature
- **THEN** `session.core` is defined with `account.coreAddress` set

#### Scenario: file-keystore backend
- **WHEN** `createSignerSession({ kind: 'file-keystore', path, passphrase, ref, accountIndex: 0 })`
- **THEN** the mnemonic is decrypted and `session.eSpace` signs correctly
- **THEN** wrong passphrase throws `KeystoreError` with code `services/keystore/bad-passphrase`

#### Scenario: env-var shorthand
- **WHEN** `CFX_KEYSTORE_PATH` and `CFX_PASSPHRASE` are set and
  `createSignerSession({ kind: 'file-keystore' })` is called with no explicit path/passphrase
- **THEN** the session is created using the env-var values

### Requirement: session-dispose
`SignerSession.dispose()` must release hardware transport resources.

#### Scenario: ledger transport close
- **WHEN** `session.dispose()` is called on a Ledger session
- **THEN** `transport.close()` is invoked

### Requirement: cdk-sign-commands
`cdk sign message <msg>` must sign and print the hex signature.

#### Scenario: file-keystore via env
- **WHEN** `CFX_PASSPHRASE` and `CFX_KEYSTORE_PATH` are set and
  `cdk sign message "Hello"` is run
- **THEN** a hex signature is printed to stdout
- **THEN** process exits 0

#### Scenario: missing credentials
- **WHEN** neither env vars nor explicit args are provided
- **THEN** `cdk sign message "Hello"` prints a usage error and exits 1

### Requirement: mcp-offline-fallback
`cfxdevkit_wallet_sign_message` must work without devnode-server when env vars are set.

#### Scenario: offline sign
- **WHEN** devnode-server is unreachable AND `CFX_PASSPHRASE` + `CFX_KEYSTORE_PATH` are set
- **THEN** `cfxdevkit_wallet_sign_message` returns the signature using `createSignerSession`
- **THEN** the response notes that the offline path was used
