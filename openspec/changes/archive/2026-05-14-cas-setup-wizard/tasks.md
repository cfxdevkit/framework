## 1. Package Scaffold

- [x] 1.1 Create `projects/cas/packages/setup/package.json` with `@cfxdevkit/cas-setup` name, `bin` entry pointing to `dist/index.js`, and dependencies: `@inquirer/prompts`, `viem`, `commander`, plus workspace deps `@cfxdevkit/contracts`, `@cfxdevkit/protocol`
- [x] 1.2 Create `projects/cas/packages/setup/tsconfig.json` extending the repo base config
- [x] 1.3 Create `projects/cas/packages/setup/tsup.config.ts` targeting CJS, entry `src/index.ts`
- [x] 1.4 Register `packages/setup` in `projects/cas/pnpm-workspace.yaml` (or root workspace)
- [x] 1.5 Add `"setup": "pnpm --filter @cfxdevkit/cas-setup start"` script to `projects/cas/package.json`

## 2. WizardState Type & Orchestrator

- [x] 2.1 Create `src/wizard.ts` defining the `WizardState` type (network, rpcUrl, contract addresses, keeperEnabled, signerKey, adminAddresses, etc.)
- [x] 2.2 Implement the linear orchestrator in `src/wizard.ts` that calls each phase in order and accumulates state
- [x] 2.3 Create `src/index.ts` as the commander CLI entrypoint: parse `--force` flag, call `runWizard()`, handle process exit codes

## 3. Phase: Environment Check

- [x] 3.1 Create `src/steps/check-env.ts`: verify Node ≥ 24, print pass/fail
- [x] 3.2 Implement RPC connectivity check in `check-env.ts`: `eth_blockNumber` via `fetch`, 5s timeout, retry prompt on failure

## 4. Phase: Network Selection

- [x] 4.1 Create `src/steps/select-network.ts`: `@inquirer/prompts` select with testnet / mainnet / local-devnode options
- [x] 4.2 Pre-fill contract addresses from `@cfxdevkit/protocol` `automationManagerAddress`, `permitHandlerAddress`, `swappiPriceAdapterAddress` for testnet/mainnet selections
- [x] 4.3 Prompt for custom RPC URL override; re-run RPC check against new URL

## 5. Phase: Contract Mode

- [x] 5.1 Create `src/steps/contract-mode.ts`: for local network, offer "Deploy fresh" option; for testnet/mainnet, skip
- [x] 5.2 Implement fresh deploy flow: prompt for deployer private key (masked), call `deployContract()` for AutomationManager, PermitHandler, SwappiPriceAdapter in sequence using `@cfxdevkit/contracts/deploy`
- [x] 5.3 Capture deployed addresses from receipts and write to wizard state

## 6. Phase: Keeper Configuration

- [x] 6.1 Create `src/steps/configure-keeper.ts`: confirm prompt "Enable keeper mode? [y/N]"
- [x] 6.2 If yes: prompt for signer private key (masked), derive address, check native CFX balance
- [x] 6.3 Create `src/chain/read.ts`: `isKeeper(address)` and `getBalance(address)` using viem `createPublicClient`
- [x] 6.4 If not registered: prompt for owner private key (masked), call `setKeeper(signerAddress, true)` via `@cfxdevkit/contracts/write`, wait for receipt, display tx hash
- [x] 6.5 Warn if signer balance is zero CFX; prompt for confirmation to continue

## 7. Phase: Env Write

- [x] 7.1 Create `src/steps/write-env.ts`: generate backend `.env` string from wizard state (all vars from `.env.example`)
- [x] 7.2 Generate frontend `.env.local` string from wizard state (all vars from `.env.local.example`)
- [x] 7.3 Implement overwrite guard: check file existence, prompt unless `--force`, write files, print confirmation

## 8. Phase: Launch

- [x] 8.1 Create `src/runner.ts`: `spawn()` backend and frontend processes, prefix logs `[backend]` / `[frontend]`, stream to stdout
- [x] 8.2 Handle child process exit: log exit code, do not auto-restart by default
- [x] 8.3 Handle `SIGINT`: send `SIGTERM` to children, await exit, clean shutdown
- [x] 8.4 In `src/steps/launch.ts`: build shared package first (`execSync`), ask "Launch CAS now? [Y/n]", call `runner.start()` or print manual instructions

## 9. Tests

- [x] 9.1 Create `src/wizard.test.ts`: unit test orchestrator with mocked phase functions — verify state accumulation and phase order
- [x] 9.2 Create `src/steps/check-env.test.ts`: mock `process.version` and mock `fetch` — test pass and fail scenarios
- [x] 9.3 Create `src/steps/write-env.test.ts`: test generated env string content for testnet, mainnet, and keeper-enabled scenarios
