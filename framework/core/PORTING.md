# framework/core — Porting Plan

> **Source:** `/home/sp/Documents/Code/devkit/packages/core` (`@cfxdevkit/core@1.2.5` reference implementation).
> **Target:** `framework/core` in this monorepo, conforming to [API.md](./API.md) + [STRUCTURE.md](./STRUCTURE.md) + the tier rules in [ARCHITECTURE.md](../../ARCHITECTURE.md).
>
> This document is the **traceability matrix**: every public symbol exported by the source must appear below with a verdict (port / rename / reshape / relocate / drop). When the port is complete, this file becomes the proof of 100% coverage.

## Verdict legend

| Verdict | Meaning |
|---|---|
| **PORT** | Source matches docs 1:1 (modulo casing). Copy and adapt. |
| **RENAME** | Same shape, different identifier. Doc name wins. |
| **RESHAPE** | Source uses class / orchestrator; docs prescribe functional verbs. |
| **RELOCATE** | Belongs in another framework package per tier rules. |
| **NEW** | Required by docs but no source equivalent — implement from scratch. |
| **DROP** | Source has it but it is devkit-specific, internal, or duplicative. |

Items marked **PORT** or **RENAME** are mechanical. **RESHAPE** items must be designed to satisfy the functional API.

---

## A. Source-side inventory (every public export)

### `src/clients/`

| Source | Verdict | Target |
|---|---|---|
| `ClientManager` (class extending EventEmitter) | **DROP** | Multi-chain orchestration belongs to consumers. The opaque `Client` factory replaces it. |
| `CoreClient` (cive-based class) | **RESHAPE** → `createClient({ chain, transport })` | `core/client` |
| `CoreTestClient`, `CoreWalletClient` | **DROP** as classes; **RESHAPE** | `core/client` (test actions become methods on `Client.test?`); wallet actions go through `Signer` (no wallet-client class). |
| `EspaceClient` (viem-based class) | **RESHAPE** → `createClient` | `core/client` |
| `EspaceTestClient`, `EspaceWalletClient` | **DROP** as classes; **RESHAPE** | Same as above. |

### `src/config/`

| Source | Verdict | Target |
|---|---|---|
| `CORE_MAINNET` | **RENAME** → `coreSpaceMainnet` | `core/chains` |
| `CORE_TESTNET` | **RENAME** → `coreSpaceTestnet` | `core/chains` |
| `CORE_LOCAL` | **RENAME** → `coreSpaceLocal` | `core/chains` (was missing from API.md — add) |
| `EVM_MAINNET` | **RENAME** → `espaceMainnet` | `core/chains` |
| `EVM_TESTNET` | **RENAME** → `espaceTestnet` | `core/chains` |
| `EVM_LOCAL` | **RENAME** → `espaceLocal` | `core/chains` (was missing from API.md — add) |
| `getChainConfig(idOrName)` | **RENAME** → `getChain` | `core/chains` |
| `getCoreChains()`, `getEvmChains()`, `getMainnetChains()` | **RESHAPE** → `listChains({ family?, network? })` | `core/chains` |
| `defaultNetworkSelector`, `NetworkSelector` class | **DROP** | Devkit runtime state. Belongs to `platform/devtools` if revived. |
| `ChainConfig` type | **PORT** (rename `type` → `family`, `testnet` → `network`) | `core/chains` |
| `SupportedChainId` type | **RENAME** → `ChainId` | `core/types` |

### `src/types/`

| Source | Verdict | Target |
|---|---|---|
| `Address`, `Hash`, `CoreAddress`, `EvmAddress` | **PORT** | `core/types` |
| `BaseTransaction` | **RENAME** → `TxRequest` | `core/types` |
| `TransactionReceipt` | **RENAME** → `TxReceipt` | `core/types` |
| `Log`, `BlockEvent`, `TransactionEvent`, `EventCallback`, `UnwatchFunction` | **PORT** | `core/types` |
| `ChainClient`, `TestClient`, `WalletClient`, `ChainStatus`, `HealthStatus` | **DROP** | Tied to old class hierarchy; replaced by opaque `Client`. |
| `ClientConfig`, `WalletConfig`, `TestConfig` | **DROP** | Folded into `createClient` input. |
| `ClientManagerConfig`, `ClientManagerEvents`, `ClientManagerStatus` | **DROP** | With `ClientManager`. |
| `CoreClientInstance`, `EspaceClientInstance` | **DROP** | Aggregations no longer needed. |
| `UnifiedAccount` | **RESHAPE** → `Account = { address, publicKey }` | `core/wallet`. Multi-chain account aggregation is consumer concern. |
| `StartOptions`, `DeployOptions`, `ReadOptions`, `WriteOptions`, `ContractResult`, `FaucetBalances`, `MiningStatus`, `ChainBalances` | **DROP** | Devnode/devkit script types — belong in `framework/devnode` or `platform/devtools`. |

### `src/utils/`

| Source | Verdict | Target |
|---|---|---|
| `logger`, `LogMessage` | **DROP** from public API | Logging is application-level. Move to `platform/devtools` if revived. |
| `stringifyBigInt(value, space?)` | **PORT** (add to docs) | `core/units` (BigInt-aware JSON helper) |

### `src/wallet/derivation.ts`

| Source | Verdict | Target |
|---|---|---|
| `generateMnemonic(strength?)` | **PORT** (add to docs) | `core/wallet` |
| `validateMnemonic(mnemonic)` | **PORT** (add to docs) | `core/wallet` |
| `deriveAccount(input)` | **PORT** | `core/wallet` |
| `deriveAccounts(input)` | **PORT** | `core/wallet` |
| `deriveFaucetAccount(...)` | **DROP** | Devkit-specific (faucet seed). Move to `platform/devtools` if revived. |
| `getDerivationPath(coinType, accountType, index)` | **DROP** from public API | Internal helper of `deriveAccount`. |

### `src/wallet/types.ts`

| Source | Verdict | Target |
|---|---|---|
| `DerivationOptions`, `DerivedAccount`, `MnemonicValidation` | **PORT** | `core/wallet` |
| `COIN_TYPES` | **DROP** from public API | Internal BIP-44 constant. |
| `CORE_NETWORK_IDS` | **DROP** | Duplicates the chain registry. |

### `src/wallet/types/index.ts`

| Source | Verdict | Target |
|---|---|---|
| `WalletError` | **PORT** | `core/errors` (extends `CfxError`) |
| `BatcherOptions`, `BatchResult`, `BatchTransaction` | **RELOCATE** | `framework/wallet` (`@cfxdevkit/wallet/batched`) |
| `BatcherError` | **RELOCATE** | `framework/wallet` (or fold into `WalletError` with code `wallet/batch/*`) |
| `SessionKey`, `SessionKeyOptions`, `SessionKeyPermissions` | **RELOCATE** | `framework/wallet` (`@cfxdevkit/wallet/session-key`) |
| `SessionKeyError` | **RELOCATE** | `framework/wallet` (or fold into `WalletError`) |
| `SignedTransaction`, `SignTransactionRequest` | **RESHAPE** → `SignableTx` | `core/wallet` |
| `EmbeddedWallet`, `EmbeddedWalletOptions`, `EmbeddedWalletError`, `WalletExport`, `WalletManagerOptions` | **RELOCATE** + review | `framework/wallet` (only if embedded-wallet is part of the framework; otherwise drop) |

### `src/wallet/batching/`, `src/wallet/embedded/`, `src/wallet/session-keys/`

| Source | Verdict | Target |
|---|---|---|
| `TransactionBatcher` (class) | **RELOCATE** + **RESHAPE** | Signer-aware multisend → `@cfxdevkit/wallet/batched` (functional). Signer-free coalescing → `@cfxdevkit/core/batch` as `createBatcher`. |
| `EmbeddedWalletManager` (class) | **RELOCATE** | `@cfxdevkit/wallet` root if retained; otherwise drop. |
| `SessionKeyManager` (class) | **RELOCATE** + **RESHAPE** | `@cfxdevkit/wallet/session-key` as `issueSessionKey`, `rotateSessionKey`, `revokeSessionKey`. |

### `src/contracts/`

| Source | Verdict | Target |
|---|---|---|
| `ContractDeployer` (class) | **RESHAPE** → `deployContract(input)` | `core/contract` |
| `ContractReader` (class) | **RESHAPE** → `readContract(input)` | `core/contract` |
| `ContractWriter` (class) | **RESHAPE** → `writeContract(input)` | `core/contract` |
| `ContractError` | **PORT** | `core/errors` (extends `CfxError`, with codes) |
| `DeploymentError`, `InteractionError` | **DROP** as classes; subsume into `ContractError` codes (`core/contract/deploy`, `core/contract/interaction`) | `core/errors` |
| `ERC20_ABI`, `ERC721_ABI`, `ERC1155_ABI` | **RENAME** → `erc20Abi`, `erc721Abi`, `erc1155Abi` | `core/abi` |
| `ContractInfo`, `DeploymentOptions`, `DeploymentResult`, `ERC20TokenInfo`, `ERC721TokenInfo`, `EventFilter`, `EventLog`, `MultiChainDeploymentOptions`, `MultiChainDeploymentResult`, `NFTMetadata`, `ReadOptions`, `WriteOptions`, `WriteResult` | **PORT** as input/output types of the new functional verbs | `core/contract` |

### Re-exports from `cive` / `viem`

| Source | Verdict | Target |
|---|---|---|
| `formatCFX`, `parseCFX` | **PORT** | `core/units` (CFX-specific helpers) |
| `formatUnits`, `parseUnits` | **PORT** | `core/units` |
| `isAddress as isCoreAddress` (cive) | **PORT** | `core/address` |
| `isAddress as isEspaceAddress` (viem) | **PORT** | `core/address` |

---

## B. Doc-side requirements with no source equivalent

These are listed in `API.md` but the source has no implementation — they are **NEW** code:

- `core/client`: `Transport` type, `http(...)`, `ws(...)`, `fallback(...)` factories (wrap viem transports), `createClient({ chain, transport })`.
- `core/contract`: `simulateContract`, `parseEventLog`, `watchEvent` as `AsyncIterable`.
- `core/batch`: `multicall(input)` (Multicall3), `multisend(input)` (SafeMultisend), signer-free `createBatcher`.
- `core/abi`: `multicall3Abi`.
- `core/address`: `assertAddress`, `checksum`, `coreToEspace`, `espaceToCore` (the bridge logic exists scattered in `clients/core.ts`; consolidate).
- `core/errors`: `CfxError` root, `RpcError`, `isCfxError`.
- `core/units`: `formatToken({ decimals, symbol })`.
- `core/wallet`: `Signer` interface (formal), `signerFromPrivateKey` (test-only export).

---

## C. Dependency map (one-way, never reverse)

```
core            ← (no internal deps)
services        ← core
wallet          ← core, services
contracts       ← core
compiler        ← core
devnode         ← core
protocol        ← core, contracts
executor        ← core
testing         ← core, devnode, contracts
react           ← core   (peer: wallet)
wallet-connect  ← core   (peer: wallet)
defi-react      ← core, services, react, wallet-connect   (peer: theme)
theme           ← (no internal deps)

domains/*       ← framework/* only
platform/*      ← framework/*, domains/*
projects/*      ← any of the above
```

---

## D. Smoke-test minimum (Phase I)

Goal: prove the foundation works end-to-end against the Conflux eSpace testnet.

```ts
import { createClient, http } from '@cfxdevkit/core/client';
import { espaceTestnet } from '@cfxdevkit/core/chains';
import { formatUnits } from '@cfxdevkit/core/units';

const client = createClient({
  chain: espaceTestnet,
  transport: http(),
});

const block = await client.getBlockNumber();
const balance = await client.getBalance('0x0000000000000000000000000000000000000000');
console.log(`block=${block} balance=${formatUnits(balance, 18)} CFX`);
```

Files in scope for Phase I (≈ 500 LOC):

| Module | Files | Depends on |
|---|---|---|
| `src/types/index.ts` | primitive type aliases (re-export viem) | — |
| `src/errors/index.ts` | `CfxError`, `RpcError`, `ContractError`, `WalletError`, `isCfxError` | types |
| `src/chains/index.ts` | `ChainConfig`, the 6 chain consts, `getChain`, `listChains`, `defineChain` | types |
| `src/units/index.ts` | `formatUnits`, `parseUnits`, `formatToken`, `stringifyBigInt`, `formatCFX`, `parseCFX` | — |
| `src/client/index.ts` | `Transport`, `http`, `ws`, `fallback`, `createClient`, `Client` | chains, errors, types |
| `src/index.ts` | barrel re-exports | all above |
| `src/index.test.ts` | offline unit tests (chains, units, errors) | — |
| `src/client/smoke.test.ts` | gated network test against eSpace testnet | client + chains |

Out of scope for Phase I:
- contracts module (`readContract`, `writeContract`, `deployContract`)
- batch module
- wallet derivation
- ABIs
- address utilities (deferred to Phase II — only `isAddress` shimmed in `client` if needed)

---

## E. Phase plan (subsequent phases)

| Phase | Scope | Gate |
|---|---|---|
| **I — Foundation** ← *this commit* | types, errors, chains, units, client | `client.getBlockNumber()` + `client.getBalance()` against testnet |
| II — Contract I/O | abi, address, contract verbs, batch | `readContract` + `writeContract` + `deployContract` against a local devnode |
| III — Wallet | core/wallet (derivation), then **relocate** session-key + signers + batched + policies into `framework/wallet` | `issueSessionKey` + signed `writeContract` |
| IV — High-level helpers | erc20/erc721/erc1155/multicall3 helpers in `framework/contracts` | tokens flow E2E |
| V — Services / Executor | keystore interface + backends, executor scheduling | persistent signer + queued jobs |
| VI — Polish | TSDoc, README per package, full API.md reconciliation | `pnpm exec moon run :check` clean across all packages |

---

## F. Tracking checklist

Tick boxes as items land. The PR that closes Phase I should tick every box in the Phase I block.

### Phase I — Foundation
- [x] `core/types`: `Address`, `Hash`, `Hex`, `Wei`, `ChainId`, `BlockTag`, `Block`, `TxRequest`, `TxReceipt`, `RawLog`, `EpochTag`, `NodeStatus`
- [x] `core/errors`: `CfxError`, `RpcError`, `ContractError`, `WalletError`, `isCfxError`
- [x] `core/chains`: `ChainConfig`, 6 chain consts, `getChain`, `listChains`, `defineChain`
- [x] `core/units`: `formatUnits`, `parseUnits`, `formatToken`, `stringifyBigInt`, `formatCFX`, `parseCFX`
- [x] `core/client`: `Transport`, `http`, `ws`, `fallback`, `createClient`, discriminated `Client = EspaceClient | CoreSpaceClient`
  - `EspaceClient` (viem-backed): `getBlockNumber`, `getBlock`, `getBalance`, `getTransactionReceipt`, `estimateGas`, `request`
  - `CoreSpaceClient` (cive-backed): `getEpochNumber`, `getStatus`, `getBalance`, `request`
- [x] Sub-path exports declared in `package.json`
- [x] Multi-entry `vite.config.ts`
- [x] Smoke tests pass against eSpace testnet AND Core Space testnet (gated by `RUN_NETWORK_TESTS=1`)

### Phase II — Contract I/O
- [ ] `core/abi`: `erc20Abi`, `erc721Abi`, `erc1155Abi`, `multicall3Abi`
- [ ] `core/address`: `isAddress`, `checksum`, `assertAddress`, `coreToEspace`, `espaceToCore`
- [ ] `core/contract`: `readContract`, `writeContract`, `simulateContract`, `deployContract`, `watchEvent`, `parseEventLog`
- [ ] `core/batch`: `multicall`, `multisend`, `createBatcher`

### Phase III — Wallet
- [ ] `core/wallet`: `generateMnemonic`, `validateMnemonic`, `deriveAccount`, `deriveAccounts`, `Account`, `Signer`, `SignableTx`, `signerFromPrivateKey` (internal)
- [ ] **Relocated** to `framework/wallet`: `session-key/*`, `signers/*`, `batched/*`, `policies/*`

### Phase IV — High-level helpers
- [ ] `framework/contracts/erc20`: `balanceOf`, `allowance`, `totalSupply`, `metadata`, `transfer`, `approve`, `watchTransfers`
- [ ] `framework/contracts/erc721`, `erc1155`: parallel surface
- [ ] `framework/contracts/multicall3`: `multicall3Address` registry
- [ ] `framework/contracts/registry`: `createRegistry`

### Phase V — Services / Executor
- [ ] `framework/services/keystore`: `KeystoreProvider`, `SecretRef`, `Capability`
- [ ] `framework/services/keystore-file`, `keystore-os`, `crypto`
- [ ] `framework/wallet/signers`: `signerFromKeystore`, `signerFromHardware`, `readonlySigner`
- [ ] `framework/executor`: `Executor`, `createExecutor`

### Explicitly dropped from public API
- [ ] `ClientManager`, `NetworkSelector`, `defaultNetworkSelector`
- [ ] `Core/EspaceClient`/`TestClient`/`WalletClient` classes (replaced by opaque `Client`)
- [ ] `logger`, `LogMessage`
- [ ] `deriveFaucetAccount`, `getDerivationPath`, `COIN_TYPES`, `CORE_NETWORK_IDS`
- [ ] `EmbeddedWalletManager` & related types (pending decision)
- [ ] All `StartOptions`/`DeployOptions`/`ChainBalances`/etc. devnode-shaped types

### Explicitly relocated (tracked in their target package's PORTING.md)
- [ ] `TransactionBatcher` → `@cfxdevkit/wallet/batched` (signer-aware) + `@cfxdevkit/core/batch` (signer-free)
- [ ] `SessionKeyManager` → `@cfxdevkit/wallet/session-key`
- [ ] `EmbeddedWalletManager` → `@cfxdevkit/wallet` (or drop)
