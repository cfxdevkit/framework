## Why

`@cfxdevkit/wallet/hardware/onekey` currently exposes only the EVM (eSpace) side of the
OneKey SDK. The hardware SDK ships dedicated Conflux Core Space API methods —
`confluxGetAddress`, `confluxSignMessage`, `confluxSignMessageCIP23`,
`confluxSignTransaction` — that are completely absent from the adapter.

This means a consumer who wants to derive a Core Space address or sign a Core message
on a OneKey device has no supported path, despite the firmware supporting it since
Classic/Mini v2.4.0.

Additionally, OneKey supports two operations that **Ledger does not**:
- `evmSignTypedData` — EIP-712 typed-data signing on eSpace
- `confluxSignMessageCIP23` — CIP-23 structured typed-data signing on Core Space

These exclusive capabilities are not surfaced in the current adapter interface at all.

## What Changes

**`OneKeySdkLike` interface** — add the four Core Space SDK methods:
- `confluxGetAddress(connectId, deviceId, params)` — returns hex address + path
- `confluxSignMessage(connectId, deviceId, params)` — Core personal_sign (messageHex)
- `confluxSignMessageCIP23(connectId, deviceId, params)` — CIP-23 typed-data (messageHash + domainHash)
- `confluxSignTransaction(connectId, deviceId, params)` — Core tx (epochHeight, storageLimit, gasPrice)

**New `signerFromOneKeyCore`** — factory that uses the Core Space methods to build a
`Signer` with `account.coreAddress` (base32) populated:
- Address: `confluxGetAddress` → hex → `hexToBase32` from `@cfxdevkit/cdk/address`
- `signMessage` → `confluxSignMessage`
- `signTypedData` → `confluxSignMessageCIP23` (domainHash + messageHash)
- `signTransaction` → `confluxSignTransaction` (maps `SignableTx` to Core tx params)

**Mark Satochip on-hold** — add a `// @on-hold` comment block to
`wallet/src/hardware/satochip/index.ts` and `satochip/helpers.ts` noting that the
Python bridge dependency makes it unsuitable for the current showcase surface. The
code is preserved; no deletion.

## Capabilities

### New Capabilities
- `onekey-core-signer`: `signerFromOneKeyCore({ sdk, connectId, deviceId, path?, chainId?, networkId?, showOnDevice? })` — returns a `Signer` backed by OneKey Core Space methods.

### Modified Capabilities
- `onekey-evm-signer`: `OneKeySdkLike` interface extended with Core Space methods (additive, no breaking change).

## Impact

- `repos/cfx-keys/packages/wallet/src/hardware/onekey/index.ts` — extend `OneKeySdkLike`, add `signerFromOneKeyCore`
- `repos/cfx-keys/packages/wallet/src/hardware/onekey/helpers.ts` — add Core Space helpers (hex→base32, Core tx serialization)
- `repos/cfx-keys/packages/wallet/src/hardware/satochip/index.ts` — add on-hold notice
- `repos/cfx-keys/packages/wallet/src/hardware/satochip/helpers.ts` — add on-hold notice
- No public API removed; all changes are additive
