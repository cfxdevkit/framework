# platform/devtools

**Scope:** Internal developer-facing tools (not published as user CLIs).

| Folder | Scope | Source today |
|--------|-------|--------------|
| `contracts/` | Hardhat sources, tests, deploy scripts, wagmi codegen for framework-owned contracts | `devkit/devtools/contracts` |
| `devkit-server/` | Express CLI server + node lifecycle UI backend | `devkit/devtools/devkit` |
| `devkit-ui/` | Next.js UI embedded in the CLI | `devkit/devtools/devkit-ui` |

These power local development and CI but are never deployed to users.
