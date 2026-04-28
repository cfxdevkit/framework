# tools/codegen

Code generators consumed across the workspace.

| Sub-package                                           | Purpose                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| [contracts-extract](./contracts-extract/)             | Extracts ABI/bytecode from Hardhat artifacts → `framework/contracts` |
| [wagmi](./wagmi/)                                     | Project-local wagmi codegen wrapper convention                  |
| [api-types](./api-types/)                             | OpenAPI → TypeScript for backend ↔ frontend type sharing        |

All packages here are **private** (`"private": true`). See [../STRUCTURE.md](../STRUCTURE.md) for the full tooling layout.
