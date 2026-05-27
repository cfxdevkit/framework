## Context

`hd-web-sdk` creates an iframe pointing at OneKey's hosted SDK page
(`https://jssdk.onekey.so/`). The iframe handles USB/HID transport and communicates
back to the host page via `postMessage`. This design:
- Keeps all native transport code off the host page's bundle
- Works in any browser (no WebUSB requirement, falls back to Bridge/HID)
- Is the officially supported approach for web applications

`hd-common-connect-sdk` is the Node.js counterpart — it uses native `usb` bindings
and is not intended for bundling into browser apps.

EIP-6963 context: wagmi's `multiInjectedProviderDiscovery` fires `eip6963:requestProvider`
and collects `eip6963:announceProvider` responses from extensions. OneKey's extension
responds to this and exposes both `window.$onekey.conflux` (Core Space) and `window.$onekey`
(EVM/eSpace). The Fluent rejection guard was added to prevent Fluent's eSpace provider from
appearing in the wagmi connector list (it's a separate chain). OneKey must not be caught
by that guard even though it sets `isFluent` for portal compatibility.

## Goals / Non-Goals

**Goals:**
- `cdk docs start` (or `next dev`) loads OneKey hardware panel without bundler errors
- OneKey extension is auto-discovered by wagmi in all showcase pages
- `isFluentProvider` correctly rejects only Fluent, not OneKey
- No CDN script tags or polling loops in the codebase

**Non-Goals:**
- Supporting non-Chrome browsers for direct hardware (WebUSB is Chrome/Edge only)
- Implementing the Core Space provider path via EIP-6963 (Core Space uses `window.$onekey.conflux`, a separate integration)

## Decisions

**`hd-web-sdk` + `connectSrc: 'https://jssdk.onekey.so/'`.**
The hosted iframe is maintained by OneKey, version-locked per SDK release, and
avoids any self-hosting requirement. This is the documented production approach.

**`isFluentProvider` fix: check `isOneKey` flag.**
```ts
export function isFluentProvider(provider: unknown): boolean {
  if (typeof window === 'undefined' || typeof provider !== 'object' || provider === null) return false;
  const candidate = window as Window & { fluent?: unknown };
  const p = provider as { isFluent?: boolean; isOneKey?: boolean };
  // Reject literal window.fluent, or isFluent-only (not OneKey compat flag)
  return provider === candidate.fluent || (Boolean(p.isFluent) && !p.isOneKey);
}
```

**EIP-6963 default `true`.** The existing `RejectFluentWagmiConnector` handles the
Fluent rejection at connection time as a fallback. Enabling discovery by default matches
wagmi's own default and is the correct behaviour for a multi-wallet ecosystem.

## Risks / Trade-offs

- `connectSrc: 'https://jssdk.onekey.so/'` creates a runtime dependency on OneKey's CDN.
  If the CDN is down, direct hardware signing fails. The extension path (EIP-6963) remains
  unaffected. Acceptable for a showcase app.
- `multiInjectedProviderDiscovery: true` will surface any EIP-6963 wallet installed in
  the user's browser. The deduplication in `useEspaceConnectors` and the Fluent guard
  prevent double-listing.
