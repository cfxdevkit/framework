# cfxdevkit Scaffold Templates

Use `cfxdevkit_scaffold_list_templates` to see all available templates.
Use `cfxdevkit_scaffold_create_project` to generate a project on disk.

## minimal-dapp

**A minimal Vite + React frontend with cfxdevkit/react.**

Files generated:
- `package.json` — Vite, React, wagmi, @cfxdevkit/react
- `src/App.tsx` — wallet connect + balance display
- `src/main.tsx` — providers setup
- `vite.config.ts`
- `index.html`
- `.mcp.json` — MCP server config pointing to this server

Best for: Learning, quick prototypes, frontend-only dApps.

## project-example

**Full-stack: frontend + devnode backend server + contracts.**

Files generated:
- `packages/frontend/` — Vite + React app
- `packages/contracts/` — Solidity contracts + compile scripts
- `packages/server/` — Hono devnode server with REST API
- `pnpm-workspace.yaml` — monorepo setup
- `AGENTS.md` — MCP tool documentation for AI agents
- `CLAUDE.md` — cfxdevkit usage instructions
- `.mcp.json` — MCP server config

Best for: Full-stack dApp development with local blockchain.

## wallet-probe

**Wallet interaction testing utility.**

Files generated:
- `src/index.ts` — wallet probe script
- `package.json`

Best for: Testing wallet connections, signing flows, account derivation.

## Usage Pattern

```
// 1. Preview the template
cfxdevkit_scaffold_preview_template { template: "minimal-dapp" }

// 2. Create the project
cfxdevkit_scaffold_create_project {
  template: "minimal-dapp",
  name: "my-dapp",
  outputDir: "/home/user/projects/my-dapp"
}

// 3. Add MCP config if not included
cfxdevkit_scaffold_add_mcp_config { outputDir: "/home/user/projects/my-dapp" }
```

After scaffolding, restart the MCP server from the project directory so it can detect project context:
```json
{
  "command": "npx",
  "args": ["-y", "@cfxdevkit/mcp-server"],
  "cwd": "/home/user/projects/my-dapp"
}
```
