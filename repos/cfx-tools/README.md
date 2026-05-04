# cfx-tools

**Tier 1 — developer experience.** Carve-out target per
[ADR-0003](../../docs/adr/0003-multi-repo-split.md).

## Packages

| Package | npm | Surface |
|---------|-----|---------|
| `scaffold-cli` | `@cfxdevkit/scaffold-cli` | `pnpm dlx @cfxdevkit/scaffold` project bootstrapper |
| `mcp-server` | `@cfxdevkit/mcp-server` | Model Context Protocol server for AI agents |
| `vscode-extension` | `cfxdevkit.vscode` | VS Code integration |
| `devcontainer` | — | reusable `.devcontainer.json` + Docker images |
| `devtools` | — | shared dev scripts |
| `docs-site` | — | docs.cfxdevkit.dev (Astro/VitePress) |
| `templates` | — | starter templates referenced by scaffold-cli |

Local LLM and AI-assisted repository automation lives in [`../cfx-llm/`](../cfx-llm/).

## Why standalone

DX releases on a fast cadence (weekly), needs no semver discipline of
Tier 0, and is **never** a runtime dependency of a deployed application.

## Boundaries

- **MAY** depend on anything (`@cfxdevkit/core`, `wallet`, UI, domain).
- **MUST NOT** be depended on by `framework/`, `domains/`, or any deployed
  `projects/<app>` runtime — only by their dev/build tooling.
