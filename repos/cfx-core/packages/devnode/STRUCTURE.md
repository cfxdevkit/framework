# @cfxdevkit/devnode Structure

## Root Files
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file: directory layout documentation  
- `moon.yml` — Moon repo configuration  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite build config (for dev tooling)  
- `vitest.config.ts` — Vitest test config  

## `src/`
- `cli.ts` — CLI entrypoint and argument parsing  
- `cli.test.ts` — CLI unit tests  
- `errors.ts` — Custom error types and helpers  
- `errors.test.ts` — Error module tests  
- `index.ts` — Main package entrypoint  
- `index.test.ts` — Core module tests  
- `internals.ts` — Internal utilities and shared logic  
- `node.ts` — DevNode instance management and lifecycle  
- `node.test.ts` — DevNode tests  
- `server.ts` — HTTP server setup and request handling  
- `types.ts` — Shared TypeScript type definitions  

Directory tree:

<!-- structure-status: enriched -->
<!-- structure-hash: 495b9a65f26e00ae4110ae8e70b2a3f4c60ddb6a94fa1817e58074409c19c6fc -->
