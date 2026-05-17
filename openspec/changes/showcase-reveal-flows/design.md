## Context

The showcase-local workspace is a Next.js app that proxies requests to a shared Hono runtime
server (`@cfxdevkit/devnode-server`). The runtime already implements the two-step secret
reveal flow at `POST /keystore/reveal/request` and `POST /keystore/reveal/consume`. The
showcase exposes thin adapter routes at `/api/keystore/reveal/request` and
`/api/keystore/reveal/consume`. A `RevealPanel` and client helpers do not yet exist.

All other items in the task 4.1 operational surface (network switch, keystore lifecycle,
wallet root selection, derived accounts, node lifecycle, deployed-contract tracking, compile,
session-key flows, deploy, ABI-driven interaction) are already present in the workspace.

## Goals / Non-Goals

**Goals:**

- Surface the two-step reveal flow in a dedicated `reveal` workspace section
- Implement the minimal client helpers needed to call the two existing API routes
- Require the keystore to be in `active-wallet` phase before the panel is usable
- Auto-clear the revealed secret after display to limit exposure
- Complete task 4.1 in the `examples-showcase-local` change

**Non-Goals:**

- Modifying the backend reveal route logic or payloads
- Adding reveal methods to `@cfxdevkit/client` (the typed client) — direct `fetch` helpers
  in `app/keystore/client.ts` are sufficient for the showcase
- Persistent or copy-on-exit storage of revealed secrets

## Decisions

**Direct fetch vs. typed client**: The typed client (`showcaseRuntimeClient`) does not
expose a `reveal` namespace. Adding it would require a separate change to `@cfxdevkit/client`
and `@cfxdevkit/devnode-server`. For the showcase, two thin `fetch` helpers that call the
already-proxied Next.js API routes are the right scope.

**Two-step UI vs. single form**: The backend enforces a two-step flow (request returns a
time-limited token; consume burns it). The UI reflects this with two distinct phases: a
request form and a consume/result view. This makes the protocol visible to developers.

**Passphrase entry in the UI**: Passing the passphrase over the API is only safe because the
showcase runs entirely on localhost (or a controlled environment). The panel includes a
visible warning note to that effect.

**Auto-clear timeout**: Revealed secrets are cleared from UI state after 60 seconds to
limit accidental screen exposure. The user can click "Clear" earlier.

**Phase guard in panel**: Rather than modifying the nav gating logic, the panel itself
checks `activeWallet` and renders a locked-state message when not in `active-wallet` phase.
This keeps gate logic changes isolated.

## Risks / Trade-offs

- Passphrase is included in the request payload and travels over localhost HTTP. This is
  acceptable for a local development tool but would be a security concern in production.
  The warning note mitigates user confusion.
- The one-time token has a TTL set by the backend. If the user takes too long between
  request and consume, the token expires and they must re-request.
