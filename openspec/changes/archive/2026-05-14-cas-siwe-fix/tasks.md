## 1. Backend Startup Validation

- [x] 1.1 Add startup config logging to `apps/backend/src/index.ts`: log effective `NETWORK`, `CONFLUX_ESPACE_RPC`, and all four contract addresses at INFO level on startup
- [x] 1.2 Add CORS origins validation: if `CAS_CORS_ORIGINS` is set, parse the comma-separated list and log a WARNING if it contains no entries or appears malformed

## 2. Frontend — ChainId Guard

- [x] 2.1 In `apps/frontend/src/app/auth-context.tsx`: ensure `login()` returns early (with a clear error message) if the wallet's chainId does not match the expected Conflux eSpace chainId for `NEXT_PUBLIC_CAS_NETWORK`

## 3. Frontend — SIWE Error Categorization

- [x] 3.1 In `login()`, wrap the nonce fetch: catch `TypeError` / `fetch` failures and set error to "Cannot reach CAS backend at {url} — check NEXT_PUBLIC_CAS_API_URL"
- [x] 3.2 Detect wallet rejection (wagmi throws `UserRejectedRequestError` or similar) and set error to "Wallet signature rejected — click Sign In to try again"
- [x] 3.3 Handle non-200 verify response: set error to "Sign-in verification failed — the backend returned {status}"

## 4. E2E Smoke Test — SIWE Scenarios

- [x] 4.1 Add SIWE success scenario to `apps/backend/src/__tests__/app.test.ts`: sign a real SIWE message with `viem`'s `signMessage` using a test private key; assert 200 + JWT
- [x] 4.2 Add SIWE chainId mismatch scenario: construct SIWE message with wrong chainId; assert 401
- [x] 4.3 Add SIWE tampered message scenario: modify message after signing; assert 401
