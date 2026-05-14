## ADDED Requirements

### Requirement: SIWE errors display actionable messages
The auth context `login()` function SHALL categorize failures and display specific error messages rather than raw exception text.

#### Scenario: Backend unreachable
- **WHEN** the nonce fetch fails with a network error or 503 response
- **THEN** the error state SHALL contain the message: "Cannot reach CAS backend at {url} — check NEXT_PUBLIC_CAS_API_URL"

#### Scenario: Wallet signature rejected
- **WHEN** the user dismisses or rejects the SIWE signature request in their wallet
- **THEN** the error state SHALL contain the message: "Wallet signature rejected — click Sign In to try again"

#### Scenario: SIWE verification failed
- **WHEN** the backend `/auth/verify` call returns a non-200 status
- **THEN** the error state SHALL contain the message: "Sign-in verification failed — the backend returned {status}"

### Requirement: Wrong-network gate prevents SIWE attempt
The system SHALL check the wallet's chainId against the expected network before calling `login()`. If they do not match, the SIWE flow SHALL NOT be initiated.

#### Scenario: ChainId mismatch blocks login
- **WHEN** the wallet's active chainId does not match the Conflux eSpace chainId for the configured `NEXT_PUBLIC_CAS_NETWORK`
- **THEN** `login()` SHALL NOT be called and the wrong-network gate SHALL be shown instead
