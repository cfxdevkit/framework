## ADDED Requirements

### Requirement: capability-matrix
A comparison table must be rendered above the device panels.

#### Scenario: matrix rows
- **WHEN** the hardware section renders
- **THEN** the table has rows for: eSpace address, Core address,
  signMessage eSpace, signMessage Core, signTypedData EIP-712,
  signTypedData CIP-23, transport, device discovery
- **THEN** each row has three columns: Memory, Ledger, OneKey

#### Scenario: OneKey exclusive features
- **WHEN** the matrix renders
- **THEN** EIP-712 and CIP-23 rows show ❌ for Ledger and ✅ for OneKey

### Requirement: onekey-panel-device-info
The OneKey panel must display device information after connection.

#### Scenario: successful connection
- **WHEN** the user clicks "Connect OneKey" and grants USB permission
- **THEN** the panel shows: device model, firmware version, and masked serial
- **THEN** status chip changes from "pending" to "ok"

#### Scenario: WebUSB unavailable
- **WHEN** the browser does not support WebUSB
- **THEN** the panel shows an error chip: "WebUSB not available in this browser"
- **THEN** the connect button is disabled

### Requirement: onekey-panel-addresses
The OneKey panel must derive and display both addresses.

#### Scenario: address display
- **WHEN** device is connected
- **THEN** eSpace address (`0x…`) is shown from `m/44'/60'/0'/0/0`
- **THEN** Core address (`cfx:…` or `cfxtest:…`) is shown from `m/44'/503'/0'/0/0`

### Requirement: onekey-panel-signing
The OneKey panel must demonstrate all four signing operations.

#### Scenario: eSpace signMessage
- **WHEN** user clicks "Sign on eSpace"
- **THEN** `evmSignMessage` is called and the hex signature is displayed

#### Scenario: eSpace signTypedData (EIP-712)
- **WHEN** user clicks "Sign EIP-712"
- **THEN** `evmSignTypedData` is called with the showcase typed-data
- **THEN** the structured payload and resulting signature are displayed

#### Scenario: Core signMessage
- **WHEN** user clicks "Sign on Core"
- **THEN** `confluxSignMessage` is called and the hex signature is displayed

#### Scenario: Core signTypedData (CIP-23)
- **WHEN** user clicks "Sign CIP-23"
- **THEN** `confluxSignMessageCIP23` is called with pre-computed hashes
- **THEN** the structured payload and resulting signature are displayed

### Requirement: onekey-referral-card
The OneKey panel must include a referral section after the demos.

#### Scenario: referral card presence
- **WHEN** the OneKey panel renders (regardless of connection state)
- **THEN** a product card is shown with: OneKey name, short description, CTA button
- **THEN** if `NEXT_PUBLIC_ONEKEY_DISCOUNT_CODE` is set, a copy-able chip shows the code
- **THEN** the CTA button links to `NEXT_PUBLIC_ONEKEY_REFERRAL_URL` or `https://onekey.so`

### Requirement: ledger-panel-enhanced
The Ledger panel must show both eSpace and Core addresses.

#### Scenario: dual-space display
- **WHEN** Ledger is connected
- **THEN** both `eSpace` address and `core` base32 address are shown
- **THEN** signMessage is available for both spaces

### Requirement: file-size
No single source file in `app/keys/` may exceed 300 lines.

#### Scenario: line count
- **WHEN** all files in `app/keys/` are inspected
- **THEN** none exceeds 300 lines
