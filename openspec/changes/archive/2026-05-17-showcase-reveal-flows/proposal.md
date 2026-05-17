## Why

The showcase-local workspace already exposes backend routes for the two-step secret reveal
flow (`/api/keystore/reveal/request` and `/api/keystore/reveal/consume`) and satisfies all
other items in the `examples-showcase-local` task 4.1 operational surface, but has no UI
for this capability. Developers exploring the framework cannot verify or exercise the reveal
flow through the showcase, leaving task 4.1 incomplete.

## What Changes

- Add a `reveal` workspace section (`WorkspaceSectionId`) to the showcase shell and nav
  (under the "Auth" group)
- Add two client-side helper functions (`requestReveal`, `consumeReveal`) that call the
  existing API routes
- Add a `RevealPanel` component that walks through the two-step flow:
  1. **Request** — user selects kind (`mnemonic` | `private-key`), optionally enters an
     account index, enters their keystore passphrase, and receives a one-time token
  2. **Consume** — user submits the token and the decrypted secret is revealed and displayed
     with a copy button and an auto-clear timeout
- The panel is only accessible when the keystore phase is `active-wallet` (i.e., a wallet
  is already selected)

## Capabilities

### New Capabilities

- `keystore-secret-reveal`: Two-step UI flow for revealing a wallet mnemonic or an account
  private key from the locked keystore, using the existing `POST /api/keystore/reveal/request`
  and `POST /api/keystore/reveal/consume` backend routes.

### Modified Capabilities

(none — existing backend routes are unchanged)

## Impact

- `app/workspace/shared.ts`: adds `'reveal'` to `WorkspaceSectionId` union and the
  `WORKSPACE_SECTIONS` array
- `app/shell/index.tsx`: adds a **Reveal** nav entry under the "Auth" group; marks it
  `GATE_EXEMPT` (accessible only via phase guard in the panel itself)
- `app/keystore/client.ts`: adds `requestReveal` and `consumeReveal` fetch helpers
- `app/panels/reveal.tsx`: new panel component
- `app/panels/registry.ts`: registers the new panel under the `'reveal'` section ID
