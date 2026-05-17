# Shared Backend Tooling Surface Audit

## Consumer Surface

| Consumer | Current surface | Shared route/client mapping | Gap |
| --- | --- | --- | --- |
| MCP node tools | `cfxdevkit_node_start`, `stop`, `status`, `mine` | `client.node.start()`, `stop()`, `status()`, `mine()` -> `/node/*` | None |
| MCP account tools | `cfxdevkit_accounts_list`, `account_get`, `account_fund` | `client.accounts.list()`, `fund()` -> `/accounts`, `/accounts/fund` | `account_get` can select from `list()` |
| MCP chain resources | `cfxdevkit://chain/status`, `chain/accounts` | `client.node.status()`, `client.accounts.list()` | None |
| MCP compiler/deploy flow | compile locally, deploy with devnode account | `client.compiler.compileSources()`, `client.deploy.run()` -> `/compiler/sources`, `/deploy/run` | None for local deploy parity |
| MCP contract write flow | direct eSpace transaction signing from devnode account | `client.contracts.write()` / `client.deploy.run()` -> `/contracts/write`, `/deploy/run` | Keep unsupported ERC-20 helper paths explicit until they have dedicated backend routes |
| VS Code node commands | start, stop, restart, wipe, mine, continuous mining | `client.node.*`, `client.mining.*` -> `/node/*`, `/mining/*` | None |
| VS Code local RPC consumers | direct `DevNode.urls` and account list | devnode-server status through client-backed local runtime handle | None |
| VS Code network/keystore/deploy/contracts | already represented in UI helpers | `client.network`, `client.keystore`, `client.deploy`, `client.contracts` | Add typed reveal coverage for parity with backend |

## Backend Route Coverage

- Node: `GET /node/status`, `POST /node/start`, `stop`, `restart`, `wipe`, `mine`.
- Network: `GET /network/current`, `capabilities`, `config`; `POST /network/config`, `set`.
- Accounts: `GET /accounts`, `GET /accounts/faucet`, `POST /accounts/fund`.
- Keystore: status/setup/unlock/lock/active, wallet CRUD/account selection, reveal request/consume.
- Contracts/deploy: registry list/get/register/delete/clear, read/write/call, deploy run.
- Runtime extras: mining, compiler, session-key issue/verify, bootstrap catalog/deploy, health.

## Client Gaps To Close

- Add typed `client.health()` for `/health` smoke checks.
- Add typed `client.keystore.reveal.request()` and `consume()` for `/keystore/reveal/*`.
- Add typed `client.bootstrap.catalog()`, `get(id)`, and `deploy(input)` for `/bootstrap/*`.

No new backend routes are required for the current extension and MCP parity target.