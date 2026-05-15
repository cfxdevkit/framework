## 1. Devnode chapter + API

- [ ] 1.1 Implement `lib/devnode-instance.ts`: module-level `DevNode | null` singleton with `getOrCreate()` and `getInstance()` helpers
- [ ] 1.2 Implement `app/api/devnode/start/route.ts` (`runtime = 'nodejs'`): call `createDevNode()`, `devNode.start()`, return status + rpcUrl
- [ ] 1.3 Implement `app/api/devnode/stop/route.ts` (`runtime = 'nodejs'`): call `devNode.stop()`, return status
- [ ] 1.4 Implement `app/api/devnode/mine/route.ts` (`runtime = 'nodejs'`): accept `count`, mine blocks, return new blockNumber
- [ ] 1.5 Implement `app/api/devnode/status/route.ts` (`runtime = 'nodejs'`): return `{ status, blockNumber? }`
- [ ] 1.6 Implement `app/devnode/page.tsx`: Shell layout with sections — status, start/stop controls, mine controls, block log
- [ ] 1.7 Status section: poll GET `/api/devnode/status` on mount and after actions; show StatusBadge (running/stopped/error)
- [ ] 1.8 Mine section: number input (1–100) + "Mine" button → POST `/api/devnode/mine`; show block numbers in LogBox
- [ ] 1.9 Handle binary-not-found error from start API: show error StatusBadge with explanatory message

## 2. Keystore chapter + API

- [ ] 2.1 Implement `lib/keystore-instance.ts`: file keystore provider via `@cfxdevkit/services`, path from `LOCAL_KEYSTORE_PATH` env or `.local-data/keystore/` default
- [ ] 2.2 Implement `app/api/keystore/accounts/route.ts` (`runtime = 'nodejs'`): GET returns account list; POST creates account
- [ ] 2.3 Implement `app/keystore/page.tsx`: Shell layout with sections — provider toggle, create account, account list
- [ ] 2.4 Provider toggle: memory vs file keystore; switch updates API behavior
- [ ] 2.5 Create account section: optional label input + "Create Account" → POST `/api/keystore/accounts`; refresh list
- [ ] 2.6 Account list section: GET `/api/keystore/accounts` on mount; render each address with CopyButton and label

## 3. Session key chapter + API

- [ ] 3.1 Implement `app/api/session-key/issue/route.ts` (`runtime = 'nodejs'`): accept `signerAddress` + `policy`; call `signerFromKeystore()` + `createSessionKey()`; return attestation JWT
- [ ] 3.2 Implement `app/session-key/page.tsx`: Shell layout with sections — signer select, policy builder, attestation
- [ ] 3.3 Signer select section: dropdown populated from GET `/api/keystore/accounts`
- [ ] 3.4 Policy builder section: `allowedContracts` textarea, `allowedMethods` textarea, optional `spendLimit` input
- [ ] 3.5 Attestation section: "Issue Session Key" → POST `/api/session-key/issue`; show decoded header/payload in DemoCard and raw JWT in CodeSnippet

## 4. Compiler chapter + API

- [ ] 4.1 Implement `app/api/compile/status/route.ts` (`runtime = 'nodejs'`): call `ensureSolc()` if not ready, return `{ ready, version }`
- [ ] 4.2 Implement `app/api/compile/contract/route.ts` (`runtime = 'nodejs'`): accept `{ source, contractName }`, call `compile()`, return `{ abi, bytecode }`
- [ ] 4.3 Implement `app/compiler/page.tsx`: Shell layout with sections — status, template selector, editor, output
- [ ] 4.4 Status section: GET `/api/compile/status` on mount; show "Downloading compiler…" (pending) or "Ready" (ok) StatusBadge
- [ ] 4.5 Template selector: dropdown with `basicErc20`, `basicErc721`; "Load Template" calls `getTemplate()` on the server via API or uses a client-side helper; loads source into editor
- [ ] 4.6 Editor section: `<textarea>` for Solidity source + contract name input + "Compile" button → POST `/api/compile/contract`
- [ ] 4.7 Output section: ABI in collapsible CodeSnippet (JSON); bytecode in CodeSnippet; "Send to Deploy" button stores in sessionStorage

## 5. Deploy chapter + API

- [ ] 5.1 Implement `app/api/deploy/contract/route.ts` (`runtime = 'nodejs'`): deploy via managed signer, return `{ address, txHash }`
- [ ] 5.2 Implement `app/api/deploy/call/route.ts` (`runtime = 'nodejs'`): call read function, return `{ result }`
- [ ] 5.3 Implement `app/api/deploy/send/route.ts` (`runtime = 'nodejs'`): send write transaction, return `{ txHash, receipt }`
- [ ] 5.4 Implement `app/deploy/page.tsx`: Shell layout with sections — contract input, deploy, interact
- [ ] 5.5 Contract input section: ABI textarea + bytecode textarea (pre-filled from sessionStorage if set by compiler chapter) + signer dropdown + constructor args input
- [ ] 5.6 Deploy section: "Deploy" → POST `/api/deploy/contract`; show deployed address and txHash in LogBox
- [ ] 5.7 Interact section: function selector from parsed ABI; args inputs; "Call" or "Send" based on function mutability; show result/receipt in LogBox

## 6. Validation

- [ ] 6.1 `pnpm --filter @cfxdevkit/example-showcase-local tsc --noEmit` passes with no errors
- [ ] 6.2 `pnpm --filter @cfxdevkit/example-showcase-local build` succeeds (standard server mode, no static export)
- [ ] 6.3 `pnpm run check:hotspots` shows no new hard violations
- [ ] 6.4 Verify `.local-data/` is in `.gitignore` at `projects/examples` level
