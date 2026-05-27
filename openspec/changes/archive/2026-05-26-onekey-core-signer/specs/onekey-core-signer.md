## ADDED Requirements

### Requirement: onekey-core-address
`signerFromOneKeyCore` must return a `Signer` with `account.coreAddress` set
to the base32 `cfx:` address derived at path `m/44'/503'/0'/0/0` (default).

#### Scenario: address derivation
- **WHEN** `signerFromOneKeyCore({ sdk, connectId, deviceId, chainId: 1029 })` is called
- **THEN** `account.address` is the hex address from `confluxGetAddress`
- **THEN** `account.coreAddress` is the base32 `cfx:` form (networkId 1029)

#### Scenario: testnet address
- **WHEN** `networkId: 1` is passed
- **THEN** `account.coreAddress` starts with `cfxtest:`

### Requirement: onekey-core-sign-message
`signerFromOneKeyCore` must sign messages via `confluxSignMessage`.

#### Scenario: string message
- **WHEN** `signer.signMessage('Hello')` is called
- **THEN** `confluxSignMessage` is called with the hex encoding of `'Hello'`
- **THEN** the returned signature is a 65-byte `0x`-prefixed hex string

### Requirement: onekey-core-typed-data
`signerFromOneKeyCore` must sign CIP-23 typed-data via `confluxSignMessageCIP23`.

#### Scenario: typed data
- **WHEN** `signer.signTypedData(typedData)` is called with a valid CIP-23 structure
- **THEN** `confluxSignMessageCIP23` is called with `messageHash` and `domainHash`
- **THEN** the returned signature is a 65-byte `0x`-prefixed hex string

### Requirement: onekey-sdk-interface-complete
`OneKeySdkLike` must declare all four Core Space SDK methods alongside the existing
four EVM methods.

#### Scenario: interface completeness
- **WHEN** `OneKeySdkLike` is inspected
- **THEN** it declares `confluxGetAddress`, `confluxSignMessage`,
  `confluxSignMessageCIP23`, `confluxSignTransaction`

### Requirement: satochip-on-hold
Satochip source files must carry a visible `@on-hold` notice explaining why the
adapter is not currently used in any showcase.

#### Scenario: on-hold notice
- **WHEN** `wallet/src/hardware/satochip/index.ts` is read
- **THEN** the file-level JSDoc contains the text `@on-hold`
  and mentions the Python bridge dependency as the reason
