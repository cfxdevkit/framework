## Context

The OneKey hardware SDK (`@onekeyfe/hd-common-connect-sdk`) exposes two independent
namespaces for Conflux:

**eSpace (EVM-compatible)** — already implemented in the adapter:
- `evmGetAddress` → `m/44'/60'/0'/0/0`
- `evmSignMessage`, `evmSignTransaction`, `evmSignTypedData`

**Core Space (Conflux-native)** — missing from the adapter:
- `confluxGetAddress` → `m/44'/503'/0'/0/0`
- `confluxSignMessage` → personal_sign with `messageHex`
- `confluxSignMessageCIP23` → CIP-23 typed-data with `{ messageHash, domainHash }`
- `confluxSignTransaction` → Core tx with `{ epochHeight, storageLimit, gasPrice, nonce, ... }`

The address returned by `confluxGetAddress` is a hex string. Consumers need the
base32 `cfx:` form for display and for `account.coreAddress`. The framework already
provides `hexToBase32(hexAddress, networkId)` from `@cfxdevkit/cdk/address`.

Core Space transactions use legacy-style gas (no EIP-1559) and add two
Conflux-specific fields: `epochHeight` and `storageLimit`. The `SignableTx` from
`@cfxdevkit/cdk` is EVM-focused; we map compatible fields and throw
`HardwareWalletError` for EIP-1559-only calls.

## Goals / Non-Goals

**Goals:**
- `signerFromOneKeyCore` returns a `Signer` where `account.coreAddress` is set (base32)
- All four Core SDK methods surface correctly through the `Signer` interface
- `OneKeySdkLike` is a single interface covering both eSpace and Core Space
- Satochip on-hold notice added; no code deleted

**Non-Goals:**
- Changing the eSpace `signerFromOneKey` API
- Implementing Satochip or any other adapter
- Adding network calls or balance fetching to the adapter layer

## Decisions

**`confluxGetAddress` returns hex → use `hexToBase32`.**
The SDK docs confirm the payload field is `address: string` in hex. We convert with
`hexToBase32(address, networkId ?? 1029)` to populate `account.coreAddress`.

**CIP-23 maps to `signTypedData`.** The `Signer` interface has `signTypedData(typedData)`.
For Core Space, we compute `domainHash` and `messageHash` from the typed-data structure
using `@cfxdevkit/cdk` utilities and forward to `confluxSignMessageCIP23`. If the
caller passes `undefined` we throw `HardwareWalletError` with a descriptive message.

**Core tx mapping from `SignableTx`.** The `confluxSignTransaction` params require
`epochHeight` and `storageLimit`. These are Conflux-specific fields not present on
`SignableTx`. We set `epochHeight: '0x00'` as a safe default (equivalent to "any
recent epoch") and require callers to pass `storageLimit` via `meta` or we default
to a conservative `0x5208`. A warning is logged if defaults are used.

**Satochip: on-hold comment, not deleted.** The Python bridge dependency is a
deployment concern, not a code quality issue. The implementation stays but is clearly
marked `@on-hold` with a note in the module JSDoc.

## Risks / Trade-offs

- Core tx defaults for `epochHeight`/`storageLimit` are safe for simple transfers
  but may under-estimate `storageLimit` for contract interactions. The adapter is
  intended for showcase/demo use; production callers should supply these values.
- `hexToBase32` import adds `@cfxdevkit/cdk/address` as a dependency of
  `wallet/hardware/onekey` — this is already a transitive dep (cdk is a direct dep).
