# keystore-secret-reveal

## Overview

A two-step UI flow for revealing a wallet mnemonic phrase or an account private key
from the keystore, integrated into the showcase-local workspace as a `reveal` section.

## Requirements

### Workspace Registration

- `WorkspaceSectionId` in `app/workspace/shared.ts` MUST include `'reveal'`
- `WORKSPACE_SECTIONS` array in the same file MUST include `'reveal'`
- The shell nav MUST include a **Reveal** entry under the "Auth" group
- The reveal section MUST be listed in `GATE_EXEMPT` in `app/shell/index.tsx` (phase
  guard lives inside the panel component)

### Client Helpers (`app/keystore/client.ts`)

- MUST export `requestReveal(input: RevealRequestInput): Promise<RevealRequestResponse>`
  - Calls `POST /api/keystore/reveal/request`
  - `RevealRequestInput`: `{ walletId: string; passphrase: string; kind: 'mnemonic' | 'private-key'; accountIndex?: number; ttlMs?: number }`
  - `RevealRequestResponse`: `{ ok: boolean; request?: { token: string }; error?: string }`
- MUST export `consumeReveal(token: string): Promise<RevealConsumeResponse>`
  - Calls `POST /api/keystore/reveal/consume`
  - `RevealConsumeResponse`: `{ ok: boolean; reveal?: { secret: string }; error?: string }`
- Helpers MUST use plain `fetch` (not the typed client); JSON bodies; no credentials

### RevealPanel Component (`app/panels/reveal.tsx`)

#### Phase guard
- When `activeWallet` is null (keystore not in `active-wallet` phase), the panel MUST
  display a message: "Unlock the keystore and activate a wallet to use secret reveal."
- No form elements MUST be rendered in the guarded state

#### Request step
- The panel MUST display a form with:
  - A **Kind** selector: radio or select with options `mnemonic` and `private-key`
  - An **Account index** number input, visible only when kind is `private-key`; defaults
    to the active account index from `activeWallet.activeAccountIndex`
  - A **Passphrase** password input (type="password")
  - A **Request reveal** button; disabled while a request is in-flight
- On submit:
  - Calls `requestReveal` with `{ walletId: activeWallet.id, passphrase, kind, accountIndex? }`
  - On success, transitions to the consume step with the returned token pre-filled
  - On error, displays the error message inline (no navigation)

#### Consume step
- Displays the received token in a read-only field (allows manual copy for testing)
- Shows a **Reveal secret** button; disabled while in-flight
- On click, calls `consumeReveal(token)`
- On success:
  - Displays the revealed secret in a read-only textarea with a `CopyButton`
  - Starts a 60-second auto-clear countdown displayed as `Clears in Xs`
  - Shows a **Clear** button to immediately clear the secret and reset to request step
- On error, displays the error message and allows the user to go back to the request step
- A warning note MUST be shown above the secret: "This secret is visible in your
  browser. Never share it or paste it into untrusted contexts."

#### Panel header note
- A static note MUST appear at the top of the panel: "The passphrase travels over
  localhost HTTP. This panel is only safe in a local development environment."

### Panel Registration (`app/panels/registry.ts`)

- The `RevealPanel` MUST be registered under section ID `'reveal'`
