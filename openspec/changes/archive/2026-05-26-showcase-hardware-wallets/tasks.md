## P1 — Wallet package: Satochip on-hold

- [x] **P1.1** Add `@on-hold` JSDoc notice to `wallet/src/hardware/satochip/index.ts` (see onekey-core-signer change P4.1)
- [x] **P1.2** Add one-liner on-hold notice to `wallet/src/hardware/satochip/helpers.ts`
- [x] **P1.3** Add on-hold comment next to satochip export in `wallet/src/hardware/index.ts`

> **Note:** P1 duplicates tasks from `onekey-core-signer`. If that change is applied first,
> skip P1 and verify the notices exist before continuing.

## P2 — Install OneKey SDK

- [x] **P2.1** Add `@onekeyfe/hd-common-connect-sdk` to `showcase-public/package.json` dependencies
- [x] **P2.2** Run `pnpm install` in the showcase-public workspace
- [x] **P2.3** Add `NEXT_PUBLIC_ONEKEY_REFERRAL_URL=` and `NEXT_PUBLIC_ONEKEY_DISCOUNT_CODE=` to `.env.example`
- [x] **P2.4** Confirm TypeScript can resolve the package types

## P3 — Capability matrix component

- [x] **P3.1** Create `app/keys/capability-matrix.tsx`:
  - Table rows: eSpace addr, Core addr, signMessage (eSpace), signMessage (Core),
    signTypedData EIP-712, signTypedData CIP-23, transport, device discovery
  - Three data columns: Memory, Ledger, OneKey
  - Cell values: ✅, ❌, or a short note (e.g. "WebHID", "WebUSB", "fw 2.3+")
  - Style using existing CFX design tokens (`--cfx-color-*`, `--cfx-space-*`)
  - OneKey column header has a subtle highlight to draw attention
- [x] **P3.2** Export `CapabilityMatrix` from the file

## P4 — Memory wallet panel (extract + EIP-712)

- [x] **P4.1** Extract the existing `MemoryWalletPanel` from `hardware-wallet-section.tsx`
  into `app/keys/memory-panel.tsx`
- [x] **P4.2** Add `signTypedData` demo: use a static EIP-712 payload
  (`{ domain: { name: 'Showcase', chainId: 71 }, ... }`) and display the result
- [x] **P4.3** Export `MemoryPanel` from the file

## P5 — Ledger panel (extract + Core Space)

- [x] **P5.1** Extract `LedgerWalletPanel` from `hardware-wallet-section.tsx`
  into `app/keys/ledger-panel.tsx`
- [x] **P5.2** Extend connect flow: after eSpace signer is obtained, also derive Core signer
  using `createLedgerHardwareAdapter({ family: 'core', coreTransport: transport, ... })`
- [x] **P5.3** Display Core Space address (`cfx:…`) alongside the eSpace address
- [x] **P5.4** Add a second "Sign on Core" button that calls `coreSigner.signMessage(message)`
- [x] **P5.5** Add a note chip: "EIP-712 and CIP-23: ❌ not supported on Ledger"
- [x] **P5.6** Export `LedgerPanel` from the file

## P6 — OneKey panel

- [x] **P6.1** Create `app/keys/onekey-panel.tsx`
- [x] **P6.2** Implement Step A — Connect & Device Info:
  - Detect WebUSB via `'usb' in navigator`
  - Show disabled "Connect OneKey" button if WebUSB unavailable
  - On click: dynamic `import('@onekeyfe/hd-common-connect-sdk')`, call
    `HardwareSDK.init({ env: 'webusb', debug: false })`
  - Call `searchDevices()` → take first device's `connectId`
  - Call `getFeatures(connectId)` → extract `{ deviceId, onekey_version, label }`
  - Show device info card: model label, firmware version, masked serial
- [x] **P6.3** Implement Step B — Addresses:
  - Call `signerFromOneKey(...)` for eSpace address (existing adapter)
  - Call `signerFromOneKeyCore(...)` for Core Space address (new adapter from `onekey-core-signer` change)
  - Display both addresses with copy buttons
  - "Show on device" toggle: passes `showOnDevice: true` to both signers
- [x] **P6.4** Implement Step C — Signing (4 operations, each with its own sub-card):
  - **eSpace signMessage**: input field for message → `eSpaceSigner.signMessage(msg)` → show signature
  - **eSpace signTypedData EIP-712**: show static payload → `eSpaceSigner.signTypedData(payload)` → show result. Label: "✅ Exclusive: Ledger does not support EIP-712"
  - **Core signMessage**: input field → `coreSigner.signMessage(msg)` → show signature
  - **Core signTypedData CIP-23**: show static CIP-23 payload → `coreSigner.signTypedData(payload)` → show result. Label: "✅ Exclusive: Ledger does not support CIP-23"
- [x] **P6.5** Implement Step D — Referral card:
  - Product name "OneKey Classic S1", one-line description, logo/icon
  - If `NEXT_PUBLIC_ONEKEY_DISCOUNT_CODE` is set: show copy-able code chip
  - CTA button: "Get OneKey Classic S1 →" links to `NEXT_PUBLIC_ONEKEY_REFERRAL_URL ?? 'https://onekey.so'`
  - Style: distinct background, slightly elevated card
- [x] **P6.6** Export `OneKeyPanel` from the file

## P7 — Orchestrator: hardware-wallet-section.tsx

- [x] **P7.1** Rewrite `hardware-wallet-section.tsx` to:
  - Import and render `CapabilityMatrix`, `MemoryPanel`, `LedgerPanel`, `OneKeyPanel`
  - Update section `title` and `description` in the outer `DemoCard`
  - Keep the responsive `GRID_STYLE` for the three device panels
- [x] **P7.2** File must be ≤ 80 lines (pure orchestration)

## P8 — Nav rename

- [x] **P8.1** In `app/site-layout.tsx`, change `{ label: 'Keys', href: '/keys' }` to
  `{ label: 'Keys & Signers', href: '/keys' }`

## Validate

- [x] **V.1** `pnpm run typecheck` passes for `showcase-public`
- [x] **V.2** `pnpm run lint` passes for `showcase-public`
- [x] **V.3** `pnpm run build` passes (no SSR errors from OneKey SDK)
- [x] **V.4** No file in `app/keys/` exceeds 300 lines
- [x] **V.5** Capability matrix renders all 8 rows and 3 columns
- [x] **V.6** OneKey panel is present and shows the referral card
- [x] **V.7** Ledger panel shows both eSpace and Core addresses after connection
