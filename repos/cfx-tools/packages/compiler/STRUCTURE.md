# @cfxdevkit/compiler Structure

## Root
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `moon.yml` — Moonrepo workspace config  
- `package.json` — Package metadata and dependencies  

## `src/`
- `artifacts.test.ts` — Tests for artifact generation utilities  
- `artifacts.ts` — Helpers for handling compiled contract artifacts  
- `errors.test.ts` — Tests for compiler error types  
- `errors.ts` — Compiler-specific error definitions  
- `index.test.ts` — Core module tests  
- `index.ts` — Main entry point  
- `integration.test.ts` — End-to-end integration tests  
- `resolver/`  
  - `index.test.ts` — Resolver module tests  
  - `index.ts` — Dependency resolution logic  
- `solc/`  
  - `compile.test.ts` — Solidity compilation tests  
  - `compile.ts` — Solidity compiler wrapper  
  - `helpers.ts` — Internal Solidity helpers  
  - `index.test.ts` — Solc module tests  
  - `index.ts` — Solc entry point  
  - `loader.test.ts` — Solc binary loader tests  
  - `loader.ts` — Dynamic Solc binary loading  
- `templates/`  
  - `ballot/source.ts` — Ballot contract template  
  - `counter/source.ts` — Counter contract template  
  - `erc20/source.test.ts` — ERC20 template tests  
  - `erc20/source.ts` — ERC20 contract template  
  - `erc721/source.test.ts` — ERC721 template tests  
  - `erc721/source.ts` — ERC721 contract template  
  - `escrow/source.ts` — Escrow contract template  
  - `index.test.ts` — Templates module tests  
  - `index.ts` — Templates entry point  
  - `multisig/source.ts` — Multisig wallet template  
  - `registry/source.ts` — Registry contract template  
  - `storage/source.ts` — Storage contract template  
  - `test-token/source.ts` — Test token template  
  - `vault/source.ts` — Vault contract template  
  - `voting/source.ts` — Voting contract template  
- `types.ts` — Shared TypeScript type definitions  

## Config
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite build config (for dev tooling)  
- `vitest.config.ts` — Vitest test runner config  

Directory tree:
```
.gitignore
API.md
README.md
STRUCTURE.md
moon.yml
package.json
src/
  artifacts.test.ts
  artifacts.ts
  errors.test.ts
  errors.ts
  index.test.ts
  index.ts
  integration.test.ts
  resolver/
    index.test.ts
    index.ts
  solc/
    compile.test.ts
    compile.ts
    helpers.ts
    index.test.ts
    index.ts
    loader.test.ts
    loader.ts
  templates/
    ballot/
      source.ts
    counter/
      source.ts
    erc20/
      source.test.ts
      source.ts
    erc721/
      source.test.ts
      source.ts
    escrow/
      source.ts
    index.test.ts
    index.ts
    multisig/
      source.ts
    registry/
      source.ts
    storage/
      source.ts
    test-token/
      source.ts
    vault/
      source.ts
    voting/
      source.ts
  types.ts
tsconfig.json
vite.config.ts
vitest.config.ts
```

<!-- structure-status: enriched -->
<!-- structure-hash: 6bef30e770a2dd4ff824bf5994b5dd521620e413d31a5848bd0c156ca92888d0 -->
