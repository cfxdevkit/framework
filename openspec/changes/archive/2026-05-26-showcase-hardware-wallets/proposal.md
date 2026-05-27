## Why

The current `hardware-wallet-section.tsx` has two narrow panels — memory wallet and
Ledger — with no comparison context, no OneKey support, and no way for a visitor to
understand what each signer can and cannot do on Conflux.

OneKey Classic S1 has arrived and OneKey will provide a referral link and discount
code. The showcase needs to present OneKey prominently with all its capabilities
demonstrated — including the operations it supports that Ledger does not (EIP-712
typed-data and CIP-23 Core typed-data).

Satochip requires a Python bridge sidecar and is not suitable for a browser showcase;
it is on-hold.

## What Changes

**Replace** `hardware-wallet-section.tsx` with a fully redesigned section:

### 1 — Capability comparison matrix
A sticky-header table showing every signer × every feature with ✅/❌/⚠️ cells:

| Feature | Memory | Ledger | OneKey |
|---|---|---|---|
| eSpace address | ✅ | ✅ | ✅ |
| Core Space address | ✅ | ✅ | ✅ |
| signMessage (eSpace) | ✅ | ✅ | ✅ |
| signMessage (Core) | ✅ | ✅ fw 2.3+ | ✅ |
| signTypedData EIP-712 | ✅ | ❌ | ✅ |
| signTypedData CIP-23 | ✅ | ❌ | ✅ |
| Transport | in-browser | WebHID | WebUSB |
| Device discovery | — | manual | `searchDevices()` |

### 2 — Memory wallet panel (keep, minor cleanup)
- Generate random key → show both addresses + sign message
- Add signTypedData (EIP-712) demo

### 3 — Ledger panel (enhanced)
- Connect (WebHID) → show eSpace + Core addresses
- signMessage on eSpace
- signMessage on Core
- Clear note: EIP-712 / CIP-23 not supported on Ledger

### 4 — OneKey panel (new, prominent)
Four progressive steps:

**Step A — Connect & Device Info**
- `init` + `searchDevices()` → show device name, firmware version, serial
- Status chip: connected / searching / not found

**Step B — Addresses**
- eSpace address (`evmGetAddress` path `m/44'/60'/0'/0/0`)
- Core Space address (`confluxGetAddress` path `m/44'/503'/0'/0/0`) with base32 display
- "Show on device" toggle for both

**Step C — Sign (4 operations)**
- eSpace `signMessage` — personal_sign
- eSpace `signTypedData` — EIP-712 with a pre-built showcase typed-data payload
- Core `signMessage` — personal_sign via `confluxSignMessage`
- Core `signTypedData` — CIP-23 via `confluxSignMessageCIP23`

**Step D — Referral card**
- OneKey product image + description
- Discount code badge
- "Buy OneKey Classic S1" CTA link (referral URL as env var `NEXT_PUBLIC_ONEKEY_REFERRAL_URL`)

### 5 — Nav rename
Rename the nav entry from "Keys" → "Keys & Signers" to better reflect the section scope.

## Capabilities

### New Capabilities
- `onekey-wallet-panel`: Full OneKey demo panel with device discovery, both-space addresses, all 4 signing operations, referral card.
- `hardware-comparison-matrix`: Cross-signer capability table.

### Modified Capabilities
- `hardware-wallet-section`: Replaces the existing two-panel layout with the four-section design above.

## Impact

- `projects/examples/apps/showcase-public/app/keys/hardware-wallet-section.tsx` — full rewrite
- `projects/examples/apps/showcase-public/app/keys/onekey-panel.tsx` — new file
- `projects/examples/apps/showcase-public/app/keys/ledger-panel.tsx` — extracted + enhanced
- `projects/examples/apps/showcase-public/app/keys/memory-panel.tsx` — extracted + EIP-712 demo
- `projects/examples/apps/showcase-public/app/keys/capability-matrix.tsx` — new file
- `projects/examples/apps/showcase-public/app/site-layout.tsx` — rename "Keys" → "Keys & Signers"
- `projects/examples/apps/showcase-public/package.json` — add `@onekeyfe/hd-common-connect-sdk`
- `projects/examples/apps/showcase-public/.env.example` — add `NEXT_PUBLIC_ONEKEY_REFERRAL_URL`
- **Depends on:** `onekey-core-signer` change (for `signerFromOneKeyCore`)
