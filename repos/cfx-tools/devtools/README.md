# platform/devtools — Internal developer tools

**Scope:** Internal developer-facing tools (not published as user CLIs). Not part of the public `@cfxdevkit/*` surface.

| Folder | Scope | Source today |
|--------|-------|--------------|
| `contracts/` | Hardhat sources, tests, deploy scripts, wagmi codegen for framework-owned contracts | `devkit/devtools/contracts` |
| `devkit-server/` | Express CLI server + node lifecycle UI backend | `devkit/devtools/devkit` |
| `devkit-ui/` | Next.js UI embedded in the CLI | `devkit/devtools/devkit-ui` |

These power local development and CI but are never deployed to users or published to npm.
