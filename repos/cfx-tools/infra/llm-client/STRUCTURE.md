# @cfxdevkit/llm-client

## Root Files
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `biome.json` — Biome linting/formatting config  
- `moon.yml` — Moon repo workspace config  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite bundler config  

## `src/`
- `errors.ts` — Custom error types  
- `factory.ts` — Client factory functions  
- `github-models.ts` — GitHub Models provider types/impl  
- `http.test.ts` — HTTP client unit tests  
- `http.ts` — Generic HTTP client utilities  
- `index.ts` — Package entry point  
- `lemonade.ts` — Lemonade provider integration  
- `litellm.ts` — LiteLLM provider integration  
- `openai-compat.ts` — OpenAI-compatible client wrapper  
- `provider-meta.test.ts` — Provider metadata tests  
- `provider-meta.ts` — Provider metadata definitions  
- `resolve.ts` — Model/provider resolution logic  
- `types.ts` — Shared TypeScript types  

## `workers/`
### `workers/completion/`
- `client.test.ts` — Completion worker client tests  
- `client.ts` — Completion worker client implementation  
- `complete-utils.ts` — Completion utility helpers  
- `complete.ts` — Core completion logic  
- `context.ts` — Completion context management  
- `direct.ts` — Direct (non-worker) completion fallback  
- `index.ts` — Completion worker entry point  
- `json.ts` — JSON mode completion helpers  
- `runner.ts` — Worker runner orchestration  

### `workers/shared/`
- `index.ts` — Shared worker utilities entry point  
- `logging.ts` — Shared logging utilities

<!-- structure-status: enriched -->
<!-- structure-hash: 470b44c4a5147c2e492dabcd5e881ab8d45c0531c7aa517735ed15593e23c91a -->
