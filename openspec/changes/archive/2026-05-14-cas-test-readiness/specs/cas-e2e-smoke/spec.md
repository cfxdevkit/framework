## MODIFIED Requirements

### Requirement: End-to-end smoke test prerequisites are documented
The smoke test scenario SHALL document all prerequisites required for a real testnet run, not just the unit-test-level mock scenarios. This extends the existing smoke test spec to cover the operational prerequisites.

#### Scenario: Developer reads e2e smoke test prerequisites
- **WHEN** a developer wants to run the full end-to-end smoke test on testnet
- **THEN** the prerequisites are documented: testnet CFX for the user wallet, testnet USDT or WCFX for `tokenIn`, a registered keeper address, `ADMIN_ADDRESSES` configured, and both backend and frontend running

#### Scenario: Keeper must be registered before executions succeed
- **WHEN** the keeper processes a job and submits `executeLimitOrder` or `executeDCATick`
- **THEN** the transaction succeeds only if the signer address was previously registered via `setKeeper(signerAddress, true)` by the contract owner; otherwise it reverts with `Unauthorized`

#### Scenario: System status endpoint reflects keeper health
- **WHEN** the keeper has processed at least one heartbeat cycle
- **THEN** `GET /system/status` returns `worker.status: "running"` and `worker.lastSeenAt` is within the last `keeperIntervalMs` milliseconds
