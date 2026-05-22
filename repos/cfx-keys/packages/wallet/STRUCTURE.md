# @cfxdevkit/wallet — Directory Structure

## Root Files
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `moon.yml` — Moon repo configuration  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite build config (for dev/test)  
- `vitest.config.ts` — Vitest test runner config  

## `src/`
- `batcher/` — Batch signing operations  
  - `index.test.ts` — Batcher tests  
  - `index.ts` — Batcher entrypoint  
  - `types.ts` — Batcher types  
- `errors/` — Custom error definitions  
  - `index.test.ts` — Error tests  
  - `index.ts` — Error exports  
- `hardware/` — Hardware wallet integrations  
  - `index.test.ts` — Hardware tests  
  - `index.ts` — Hardware entrypoint  
  - `ledger/` — Ledger hardware wallet support  
    - `index.test.ts` — Ledger tests  
    - `index.ts` — Ledger integration  
  - `onekey/` — OneKey hardware wallet support  
    - `helpers.ts` — OneKey helper utilities  
    - `index.test.ts` — OneKey tests  
    - `index.ts` — OneKey integration  
  - `satochip/` — SatoChip hardware wallet support  
    - `helpers.ts` — SatoChip helper utilities  
    - `index.test.ts` — SatoChip tests  
    - `index.ts` — SatoChip integration  
  - `types.test.ts` — Hardware types tests  
  - `types.ts` — Shared hardware types  
- `index.test.ts` — Main entrypoint tests  
- `index.ts` — Main package entrypoint  
- `init/` — Wallet initialization logic  
  - `index.test.ts` — Init tests  
  - `index.ts` — Init logic  
- `policies/` — Wallet policy management (e.g., gas limits, approval rules)  
  - `index.test.ts` — Policy tests  
  - `index.ts` — Policy exports  
- `session-key/` — Session key generation and management  
  - `index.test.ts` — Session key tests  
  - `index.ts` — Session key logic  
- `signers/` — Signing implementations (local, remote, etc.)  
  - `index.test.ts` — Signer tests  
  - `index.ts` — Signer exports  

Directory tree:
```
.gitignore
API.md
README.md
STRUCTURE.md
moon.yml
package.json
src
  batcher
    index.test.ts
    index.ts
    types.ts
  errors
    index.test.ts
    index.ts
  hardware
    index.test.ts
    index.ts
    ledger
      index.test.ts
      index.ts
    onekey
      helpers.ts
      index.test.ts
      index.ts
    satochip
      helpers.ts
      index.test.ts
      index.ts
    types.test.ts
    types.ts
  index.test.ts
  index.ts
  init
    index.test.ts
    index.ts
  policies
    index.test.ts
    index.ts
  session-key
    index.test.ts
    index.ts
  signers
    index.test.ts
    index.ts
tsconfig.json
vite.config.ts
vitest.config.ts
```

<!-- structure-status: enriched -->
<!-- structure-hash: 45e94ce602ba02740301749c46f82633fd73f83435e2730676cbaf1f50869bc6 -->
