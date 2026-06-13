import type { TemplateFile } from '../types.js';

export const PROJECT_EXAMPLE_CONFIG_FILES: TemplateFile[] = [
  {
    path: 'biome.json',
    content: `{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": false, "ignore": ["dist", "node_modules"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "noUnusedImports": "error", "noUnusedVariables": "error" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "single" } }
}
`,
  },
  {
    path: 'pnpm-workspace.yaml',
    content: `packages:\n  - 'packages/*'\n`,
  },
  {
    path: '.vscode/extensions.json',
    content: `{
  "recommendations": [
    "biomejs.biome",
    "GitHub.copilot",
    "GitHub.copilot-chat",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
`,
  },
  {
    path: '.mcp.json',
    content: `{
  "mcpServers": {
    "cfxdevkit": {
      "command": "npx",
      "args": ["@cfxdevkit/mcp-server@latest"],
      "env": {
        "DEVKIT_BASE_URL": "http://localhost:52000"
      }
    }
  }
}
`,
  },
  {
    path: 'AGENTS.md',
    content: `# {{name}} — AI Agent Context

This project scaffolded with **Conflux DevKit**. It is a full-stack dApp with:
- \`packages/frontend\` — Vite + React + wagmi frontend
- \`packages/backend\` — Hono API server
- \`packages/contracts\` — Solidity smart contracts

## Stack
- **Chain**: Conflux eSpace (chain ID 1030 mainnet, 71 testnet, 2030 local devnet)
- **Frontend**: React 19, wagmi, viem, @cfxdevkit/defi-react
- **Backend**: Hono, Node.js
- **Contracts**: Solidity, Hardhat

## Key files
- \`deployments/contracts.json\` — deployed contract addresses
- \`scripts/deploy-contract.mjs\` — deploy script
- \`scripts/doctor.mjs\` — health check
`,
  },
  {
    path: 'CLAUDE.md',
    content: `# Claude Instructions for {{name}}

## Repository structure
- \`packages/frontend/\` — Vite React app
- \`packages/backend/\` — Hono API server
- \`packages/contracts/\` — Solidity contracts

## Build commands
\`\`\`sh
pnpm install      # install all dependencies
pnpm build        # build all packages
pnpm dev          # start dev servers
\`\`\`

## Deploy
\`\`\`sh
node scripts/deploy-contract.mjs  # deploy contracts
\`\`\`

## Key conventions
- Use Conflux eSpace for all on-chain interactions
- Contract addresses tracked in \`deployments/contracts.json\`
- Environment variables: copy \`.env.example\` to \`.env\`
`,
  },
  {
    path: '.github/workflows/ci.yml',
    content: `name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test --if-present
`,
  },
  {
    path: 'vercel.json',
    content: `{
  "buildCommand": "pnpm build",
  "outputDirectory": "packages/frontend/dist",
  "installCommand": "pnpm install",
  "framework": "vite"
}
`,
  },
  {
    path: 'deployments/contracts.json',
    content: `{
  "mainnet": {},
  "testnet": {},
  "local": {}
}
`,
  },
];
