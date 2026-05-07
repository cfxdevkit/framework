---
"@cfxdevkit/cli": minor
"@cfxdevkit/compiler": patch
"@cfxdevkit/contracts": patch
"@cfxdevkit/core": minor
"@cfxdevkit/executor": minor
"@cfxdevkit/protocol": minor
"@cfxdevkit/services": patch
"@cfxdevkit/testing": minor
"@cfxdevkit/wallet": patch
---

Add `cfx contracts extract` command to generate TypeScript modules from Hardhat artifacts
Use `viem.isHex` for robust hex validation in `ensureHex`
Replace custom hex checks with `viem.isAddress` for Core/eSpace address validation and add missing mock client methods
Add `getGasPrice`, `getTransactionCount`, and `sendRawTransaction` to Core and eSpace clients
Replace job queue abstraction with lightweight `execute`, `executeBatch`, and `createTaskQueue` APIs
Replace sponsor/cross-space/staking/storage submodules with unified primitives: `waitForTransactionReceipt`, `getChainProgress`, `estimateTransaction`, `collectLogs`
Remove placeholder exports and expose only `@cfxdevkit/services/keystore/audit`
Replace fixtures/matchers/random/clock/snapshots with `createDeferred`, `waitFor`, `createMockClient`, and `createDevNodeFixture`
Remove placeholder exports and expose only `@cfxdevkit/wallet/errors`
