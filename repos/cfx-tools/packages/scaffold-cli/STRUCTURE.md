# @cfxdevkit/create — Directory Structure

## Root
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `moon.yml` — Moonrepo workspace configuration  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite build config (for dev tooling)  
- `vitest.config.ts` — Vitest test config  

## `src/`
- `args.test.ts` — Unit tests for CLI argument parsing  
- `args.ts` — CLI argument parsing and validation logic  
- `index.test.ts` — Unit tests for main entrypoint  
- `index.ts` — Main entrypoint (CLI command handler)  
- `scaffold.test.ts` — Unit tests for scaffolding logic  
- `scaffold.ts` — Core scaffolding engine (project creation)  
- `templates/` — Template definitions for different project types  
  - `minimal-dapp.ts` — Minimal dApp template  
  - `project-example-config.ts` — Example config template  
  - `project-example-core.ts` — Example core logic template  
  - `project-example-scripts.ts` — Example scripts template  
  - `project-example.ts` — Full example project template  
  - `types.ts` — Shared template types  
  - `wallet-probe.ts` — Wallet detection template  
- `templates.test.ts` — Unit tests for template logic  
- `templates.ts` — Template registry and rendering logic  
- `validate.test.ts` — Unit tests for validation helpers  
- `validate.ts` — Input validation utilities  

Directory tree:
```
.gitignore
API.md
README.md
STRUCTURE.md
moon.yml
package.json
src
  args.test.ts
  args.ts
  index.test.ts
  index.ts
  scaffold.test.ts
  scaffold.ts
  templates
    minimal-dapp.ts
    project-example-config.ts
    project-example-core.ts
    project-example-scripts.ts
    project-example.ts
    types.ts
    wallet-probe.ts
  templates.test.ts
  templates.ts
  validate.test.ts
  validate.ts
tsconfig.json
vite.config.ts
vitest.config.ts
```

<!-- structure-status: enriched -->
<!-- structure-hash: 210d3e0348d9d5029830c3041f1ecca142700d6203cd894916a2e9721c90e70d -->
