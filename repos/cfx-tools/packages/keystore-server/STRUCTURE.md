# @cfxdevkit/keystore-server

API.md — OpenAPI/Swagger spec for the keystore server API  
README.md — Package overview, installation, and usage guide  
STRUCTURE.md — This file: directory layout documentation  
moon.yml — MoonScript workspace config for monorepo tooling  
package.json — Package metadata, scripts, and dependencies  
src  
  app.ts — Express app setup, middleware, and error handling  
  index.ts — Server entry point (starts Express app on configured port)  
  keystore  
    domain.ts — Core domain types, interfaces, and value objects  
    operations.ts — Business logic for keystore operations (CRUD, auth)  
    runtime.ts — Runtime-specific keystore implementation (e.g., file-based storage)  
  keystore.ts — Public-facing keystore API wrapper  
  routes  
    keystore.ts — HTTP route handlers for keystore operations  
tsconfig.json — TypeScript compiler options and project config  
vite.config.ts — Vite config for dev server and bundling (if used)

<!-- structure-status: enriched -->
<!-- structure-hash: 6e4b1f82d1685512d7747265cfbf3cd29f9d0db4d1c458e4509b2d6a5f426d1c -->
