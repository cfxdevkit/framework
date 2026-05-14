## Context

Three environment-level causes for SIWE failure:
- A) `NEXT_PUBLIC_CAS_API_URL` unset → frontend proxy at `/api/[...path]` returns 503 because `CasApiClient` tries the wrong base URL  
- B) `CAS_CORS_ORIGINS` set incorrectly → browser blocks the nonce fetch as a CORS error  
- C) `NEXT_PUBLIC_CAS_NETWORK` unset → wallet is on testnet but app expects mainnet, chainId mismatch causes SIWE message verification failure

The wizard eliminates A and C by generating correct env files. This change addresses B (CORS configuration validation) and improves error messaging for all three scenarios so operators can self-diagnose.

## Goals / Non-Goals

**Goals:**
- Categorize SIWE errors into distinct user-facing messages: backend unreachable, CORS blocked, chainId mismatch, wallet rejection
- Validate CORS origins at backend startup and log a warning if misconfigured
- Log effective network config and contract addresses at backend startup for easy diagnosis
- Block SIWE attempt if chainId mismatch is detected (show wrong-network gate instead)
- Add SIWE scenarios to the existing `cas-e2e-smoke` test suite

**Non-Goals:**
- Fixing misconfigured environments (the wizard does that)
- Changing the SIWE protocol or message format
- Handling expired JWTs (already handled by `refreshAuth()` in auth context)

## Decisions

### D1: Error categorization in `login()`

`login()` in `auth-context.tsx` wraps the nonce fetch and verify calls. Error categorization:
- Fetch throws `TypeError: Failed to fetch` or response is 503 → "Backend unreachable" message with URL
- Response includes CORS-related headers failure → detected by the fetch error type (same as above at the JS level; rely on URL + message text)
- chainId in wallet ≠ expected chainId → detected before SIWE via `useNetworkSwitch` (gate already exists, just need to block `login()` call path)
- User rejects in wallet → wagmi throws user rejection error → "Wallet signature rejected"

### D2: Backend startup validation

Add a validation block in `apps/backend/src/index.ts` that runs once at startup:
- Logs `[startup] NETWORK=testnet, RPC=..., AutomationManager=0x...`
- If `CAS_CORS_ORIGINS` is set, parses it and checks if the expected frontend origin (derived from `NEXT_PUBLIC_CAS_API_URL` context or just logs all origins) is present

### D3: E2E SIWE tests are backend integration tests

SIWE success/failure scenarios are added to the existing `app.test.ts` (not browser-level Playwright). The test signs a real SIWE message with a test private key against the in-memory backend.

## Risks / Trade-offs

- **[CORS detection in browser]** → The browser does not expose CORS failure details to JS; the error looks like a generic `Failed to fetch`. We can only distinguish it from "backend down" heuristically (backend down = connection refused; CORS = connected but blocked). In practice, with the wizard setting the correct origins, CORS failures should not occur in production. The error message should guide the user to check `CAS_CORS_ORIGINS` as a fallback.
- **[Deferred change]** → This change is scoped to be small. If `cas-ux-redesign` changes the auth-context significantly, the SIWE error categorization changes in this spec must be reconciled with the new auth-context implementation.
