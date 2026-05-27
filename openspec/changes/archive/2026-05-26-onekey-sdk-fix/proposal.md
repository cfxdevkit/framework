## Why

Three bugs in the current hardware wallet showcase:

**1 — Wrong SDK for browser hardware access.**
`@onekeyfe/hd-common-connect-sdk` is documented as a Node.js library. It bundles
`@noble/hashes` with subpath exports that conflict with the installed version, and
requires `fs`, `usb`, and other Node built-ins that can't be polyfilled in Turbopack.
The browser SDK is `@onekeyfe/hd-web-sdk` which uses a hosted iframe at
`https://jssdk.onekey.so/` and works cleanly in all browsers including Next.js SSR.

**2 — EIP-6963 disabled by default.**
`createConfluxWagmiConfig` sets `multiInjectedProviderDiscovery: false`. wagmi enables
EIP-6963 discovery by default; the framework override prevents OneKey (and any other
EIP-6963-compliant extension) from being auto-discovered. However, `isFluentProvider`
uses a too-broad heuristic: it rejects any provider with `isFluent: true`, and
OneKey sets that flag for Fluent-portal compatibility — so OneKey would be incorrectly
blocked even after enabling discovery.

**3 — CDN global approach is unreliable.**
`layout.tsx` loads the CJS SDK via CDN `<Script>` and polls `window.OnekeyHardwareSdk`.
The CJS bundle never exposes a browser global — the poll always times out.

## What Changes

- **Remove** `@onekeyfe/hd-common-connect-sdk` and `@noble/hashes` from
  `showcase-public/package.json`; remove the CDN `<Script>` from `layout.tsx`
- **Install** `@onekeyfe/hd-web-sdk` in `showcase-public`
- **Rewrite** `loadSdk()` in `onekey-panel.tsx` to use `hd-web-sdk`:
  ```ts
  import { HardwareWebSdk as HardwareSDK } from '@onekeyfe/hd-web-sdk';
  await HardwareSDK.init({ debug: false, connectSrc: 'https://jssdk.onekey.so/' });
  ```
- **Fix** `isFluentProvider` in `wallet-connect/src/config/createConfig.tsx`:
  reject only the literal `window.fluent` object and `isFluent && !isOneKey`
  so OneKey (which sets both flags) is not incorrectly filtered
- **Enable** EIP-6963 by default:
  `multiInjectedProviderDiscovery: options.multiInjectedProviderDiscovery ?? true`

## Capabilities

### Modified Capabilities
- `onekey-hardware-connection`: uses `hd-web-sdk` iframe; works in all browsers
- `eip6963-discovery`: enabled by default; OneKey extension auto-discovered via wagmi

## Impact

- `projects/examples/apps/showcase-public/package.json` — swap SDK deps
- `projects/examples/apps/showcase-public/app/layout.tsx` — remove CDN Script
- `projects/examples/apps/showcase-public/app/keys/onekey-panel.tsx` — rewrite loadSdk
- `projects/examples/apps/showcase-public/next.config.ts` — remove SDK externals hack
- `repos/cfx-ui/packages/wallet-connect/src/config/createConfig.tsx` — fix defaults
