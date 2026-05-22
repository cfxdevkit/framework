# @cfxdevkit/devnode-server — Directory Structure

## Root Files
- `.gitignore` — Git ignore rules  
- `API.md` — API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `lint_output.txt` — Linting output log  
- `moon.yml` — Moon repo configuration  
- `package.json` — Package metadata and dependencies  
- `precommit_output.txt` — Pre-commit hook output log  
- `test_output.log` — Test execution log  
- `tsconfig.json` — TypeScript configuration  
- `vite.config.ts` — Vite bundler configuration  

## `src/`
- `app.ts` — Express server setup and middleware  
- `cli-helpers.ts` — CLI utility functions (e.g., prompts, formatting)  
- `cli.test.ts` — CLI module unit tests  
- `cli.ts` — CLI command parsing and dispatch  
- `contracts.ts` — Smart contract lifecycle management  
- `controller.ts` — Core node orchestration logic  
- `index.ts` — Main entry point (CLI + server bootstrap)  
- `keystore/` — Keystore module (directory)  
- `network.ts` — Network configuration and management  
- `profiles.ts` — Node profile CRUD operations  
- `runtime-operations.ts` — Runtime node control (start/stop/restart)  
- `test-setup.ts` — Shared test utilities and mocks  
- `types.ts` — Shared TypeScript type definitions  

### `src/routes/`
- `accounts-funding.ts` — Account funding API routes  
- `accounts.ts` — Account management API routes  
- `bootstrap.ts` — Bootstrap node initialization routes  
- `compiler.ts` — Compiler API routes  
- `contracts-actions.ts` — Contract action (call/sendTx) routes  
- `contracts-helpers.ts` — Contract helper utilities (ABI parsing, etc.)  
- `contracts.ts` — Contract deployment and management routes  
- `deploy.ts` — Deployment-related routes  
- `mining.ts` — Mining control routes  
- `network.ts` — Network control routes  
- `node-profile.ts` — Node profile management routes  
- `session-key.ts` — Session key management routes  

### `src/keystore/`
- (Directory for keystore-related logic — contents not listed in current structure)

## Test Files (in `src/`)
- `index.basics.test.ts` — Basic functionality tests  
- `index.contracts-persistence.test.ts` — Contract persistence tests  
- `index.deploy.test.ts` — Deployment tests  
- `index.keystore.test.ts` — Keystore tests  
- `index.network.test.ts` — Network tests  
- `index.node-profiles.test.ts` — Node profile tests  
- `index.test-support.ts` — Shared test helpers  
- `index.test.ts` — Core integration tests  

Directory tree:

```
.gitignore
API.md
README.md
STRUCTURE.md
lint_output.txt
moon.yml
package.json
precommit_output.txt
src/
  app.ts
  cli-helpers.ts
  cli.test.ts
  cli.ts
  contracts.ts
  controller.ts
  index.ts
  keystore/
  network.ts
  profiles.ts
  runtime-operations.ts
  test-setup.ts
  types.ts
  routes/
    accounts-funding.ts
    accounts.ts
    bootstrap.ts
    compiler.ts
    contracts-actions.ts
    contracts-helpers.ts
    contracts.ts
    deploy.ts
    mining.ts
    network.ts
    node-profile.ts
    session-key.ts
  index.basics.test.ts
  index.contracts-persistence.test.ts
  index.deploy.test.ts
  index.keystore.test.ts
  index.network.test.ts
  index.node-profiles.test.ts
  index.test-support.ts
  index.test.ts
test_output.log
tsconfig.json
vite.config.ts
```

<!-- structure-status: enriched -->
<!-- structure-hash: facbe0bcfb2dd12a9f2f79dceaa04f0eb31cf9cc2a0e2a61776835e6fa156c56 -->
