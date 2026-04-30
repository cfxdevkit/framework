# tools/codegen

Code generators consumed across the workspace.

| Sub-package                                           | Purpose                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| [wagmi](./wagmi/)                                     | Project-local wagmi codegen wrapper convention                  |
| [api-types](./api-types/)                             | OpenAPI → TypeScript for backend ↔ frontend type sharing        |

> The Solidity-pipeline codegen tool (`@cfxdevkit/codegen-contracts`) lives in
> [`repos/cfx-solidity/packages/contracts-extract`](../../repos/cfx-solidity/packages/contracts-extract/).

All packages here are **private** (`"private": true`). See [../STRUCTURE.md](../STRUCTURE.md) for the full tooling layout.
