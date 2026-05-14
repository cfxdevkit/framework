## ADDED Requirements

### Requirement: E2E smoke test covers SIWE success flow
The backend smoke test SHALL verify that a correctly signed SIWE message results in a valid JWT.

#### Scenario: SIWE success returns JWT
- **WHEN** the test derives a SIWE message from the backend nonce and signs it with a valid test private key
- **THEN** `POST /auth/verify` SHALL return a JWT token with status 200

#### Scenario: SIWE verify rejects wrong chainId
- **WHEN** the SIWE message is constructed with a chainId that does not match the backend's configured NETWORK
- **THEN** `POST /auth/verify` SHALL return status 401

#### Scenario: SIWE verify rejects tampered message
- **WHEN** the SIWE message body is modified after signing (signature mismatch)
- **THEN** `POST /auth/verify` SHALL return status 401
