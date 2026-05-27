## P1 — Fix wallet-connect defaults

- [x] **P1.1** In `wallet-connect/src/config/createConfig.tsx`, change:
  `multiInjectedProviderDiscovery: options.multiInjectedProviderDiscovery ?? false`
  → `multiInjectedProviderDiscovery: options.multiInjectedProviderDiscovery ?? true`

- [x] **P1.2** Fix `isFluentProvider`:
  ```ts
  export function isFluentProvider(provider: unknown): boolean {
    if (typeof window === 'undefined' || typeof provider !== 'object' || provider === null) return false;
    const w = window as Window & { fluent?: unknown };
    const p = provider as { isFluent?: boolean; isOneKey?: boolean };
    return provider === w.fluent || (Boolean(p.isFluent) && !p.isOneKey);
  }
  ```

- [x] **P1.3** Run `pnpm run typecheck` and `pnpm run test` in `@cfxdevkit/wallet-connect`

## P2 — Swap OneKey SDK in showcase-public

- [x] **P2.1** Remove `@onekeyfe/hd-common-connect-sdk` and `@noble/hashes` from
  `showcase-public/package.json`; run `pnpm install`

- [x] **P2.2** Add `@onekeyfe/hd-web-sdk` to `showcase-public/package.json`

- [x] **P2.3** Remove the CDN `<Script id="onekey-sdk" ...>` block from `app/layout.tsx`

- [x] **P2.4** Remove the webpack/turbopack SDK-externals config from `next.config.ts`
  (the Node.js fallback entries added for hd-common-connect-sdk)

## P3 — Rewrite loadSdk in onekey-panel.tsx

- [x] **P3.1** Replace the `getGlobalSdk` + polling `loadSdk` with:
  ```ts
  import { HardwareWebSdk as HardwareSDK } from '@onekeyfe/hd-web-sdk';

  async function loadSdk() {
    await HardwareSDK.init({ debug: false, connectSrc: 'https://jssdk.onekey.so/' });
    return HardwareSDK;
  }
  ```
  Type `HardwareSDK` as `Parameters<typeof signerFromOneKey>[0]['sdk'] & { searchDevices, getFeatures }`

- [x] **P3.2** Remove the `OneKeySdkGlobal` type and `getGlobalSdk` function

## Validate

- [x] **V.1** `pnpm run build` passes for `showcase-public` — no "Cannot resolve" errors
- [x] **V.2** `pnpm run typecheck` passes for `wallet-connect` and `showcase-public`
- [x] **V.3** `isFluentProvider({ isFluent: true, isOneKey: true })` → `false` (unit test or manual)
- [x] **V.4** `isFluentProvider({ isFluent: true })` → `true`
- [x] **V.5** `createConfluxWagmiConfig()` config has `multiInjectedProviderDiscovery: true`
- [x] **V.6** `cdk repo precommit` passes
