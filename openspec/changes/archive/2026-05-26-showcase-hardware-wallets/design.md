## Context

showcase-public is a Next.js app. All hardware interaction happens client-side
(`'use client'`). The page at `/keys` currently has mnemonic tools at the top and
a `HardwareWalletSection` at the bottom. That section is being expanded into a
full multi-device comparison surface.

**SDK for OneKey in the browser:**
`@onekeyfe/hd-common-connect-sdk` — WebUSB transport, no iframe.
Init pattern:
```ts
import HardwareSDK from '@onekeyfe/hd-common-connect-sdk';
await HardwareSDK.init({ env: 'webusb', debug: false });
const devicesRes = await HardwareSDK.searchDevices();
const { connectId } = devicesRes.payload[0];
const featuresRes = await HardwareSDK.getFeatures(connectId);
const { deviceId, onekey_version, label } = featuresRes.payload;
```

WebUSB requires a user gesture before `navigator.usb.requestDevice()` and HTTPS.
`searchDevices()` handles the permission prompt.

**Referral config:** The OneKey referral URL and discount code are not hardcoded.
They live in `NEXT_PUBLIC_ONEKEY_REFERRAL_URL` and `NEXT_PUBLIC_ONEKEY_DISCOUNT_CODE`
env vars so they can be updated without a code change.

## Goals / Non-Goals

**Goals:**
- Single-page comparison: visitor can see all signer capabilities at a glance
- OneKey panel demonstrates all 4 signing paths (eSpace message, eSpace typed, Core message, Core typed)
- Ledger panel is enhanced to show Core Space alongside eSpace
- Referral card is prominent but non-intrusive (appears after the demo, not before)
- Each panel is a separate file (≤ 200 lines each) — no hotspot violations

**Non-Goals:**
- Transaction broadcasting or network calls (signing demos only)
- Satochip (on-hold, excluded from showcase)
- Mobile / BLE support (Classic S1 is USB-only)
- WalletConnect hardware integration

## Decisions

**File structure — one component per panel.**
`hardware-wallet-section.tsx` becomes a thin orchestrator that imports four files:
`memory-panel.tsx`, `ledger-panel.tsx`, `onekey-panel.tsx`, `capability-matrix.tsx`.
Each file stays well under the 300-line hotspot limit.

**OneKey SDK: dynamic import.**
`@onekeyfe/hd-common-connect-sdk` is large and browser-only. Import it dynamically
inside the connect handler to avoid SSR errors and keep the initial bundle lean.

**Signed payload display.**
All signing demos show the hex signature in a `CodeSnippet` with a copy button.
The EIP-712 and CIP-23 demos also show the structured payload that was signed.

**CIP-23 typed-data payload.**
Use a static showcase payload: SIWE-style domain + message hash for a "sign-in to
showcase" example. The `domainHash` and `messageHash` are pre-computed constants
(the user is not signing anything real).

**Referral card placement.**
Appears as the last sub-section of the OneKey panel, below the signing demos. It is
styled as a product card (not an alert/banner) with the OneKey logo, a short tagline,
the discount code in a copy-able chip, and a prominent CTA button.

**env vars with fallback.**
If `NEXT_PUBLIC_ONEKEY_REFERRAL_URL` is unset, the CTA button links to `onekey.so`.
If `NEXT_PUBLIC_ONEKEY_DISCOUNT_CODE` is unset, the discount chip is hidden.

## Risks / Trade-offs

- WebUSB requires Chrome/Edge desktop and HTTPS. A browser-capability notice is shown
  when WebUSB is unavailable (same pattern as the existing WebHID notice for Ledger).
- `searchDevices()` triggers a USB permission prompt. The panel guides the user through
  this with a clear "Connect device" button that is only enabled when WebUSB is detected.
- `@onekeyfe/hd-common-connect-sdk` bundle size — dynamic import + lazy loading
  ensures it does not affect initial page load.
