## Why

SIWE login fails with a "network error" in three distinct scenarios that all stem from missing or misconfigured environment variables. The wizard (`cas-setup-wizard`) eliminates these errors by generating correct `.env` files, but a subsequent hardening change is needed to surface configuration problems clearly and make the auth flow resilient to misconfiguration.

**Note**: This change is intentionally deferred until after `cas-setup-wizard` and `cas-ux-redesign` are implemented. The wizard eliminates causes A and C below at the infrastructure level; this change handles cause B (CORS) and adds diagnostic messaging for all three.

## What Changes

- Backend: validate `CAS_CORS_ORIGINS` at startup and log a clear warning if it is set but does not include the configured frontend origin
- Backend: add startup validation that logs the effective NETWORK and all contract addresses on start, making misconfiguration visible immediately
- Frontend: improve SIWE error messages — distinguish "backend unreachable (proxy 503)" from "CORS error" from "user rejected" from "chainId mismatch"
- Frontend: when the SIWE nonce fetch fails with a 503 or network error, display a specific message: "Cannot reach CAS backend at {url} — check NEXT_PUBLIC_CAS_API_URL"
- Frontend: detect chainId mismatch before attempting SIWE — if the wallet's chainId does not match `NEXT_PUBLIC_CAS_NETWORK`, show the wrong-network gate instead of attempting (and failing) SIWE
- Add E2E smoke test for SIWE flow against a properly configured local stack

## Capabilities

### New Capabilities

- `cas-siwe-error-messages`: Categorized, actionable SIWE error messages in the frontend auth flow

### Modified Capabilities

- `cas-e2e-smoke`: Add SIWE success and failure scenarios to the E2E smoke test suite

## Impact

- `projects/cas/apps/backend/src/index.ts` — add startup config validation logging
- `projects/cas/apps/backend/src/middleware/` — CORS origin validation improvement
- `projects/cas/apps/frontend/src/app/auth-context.tsx` — improve error categorization in `login()`
- `projects/cas/apps/frontend/src/hooks/useNetworkSwitch.ts` — ensure chainId check happens before SIWE attempt
- `openspec/specs/cas-e2e-smoke/` — add SIWE scenarios to existing spec (delta)
