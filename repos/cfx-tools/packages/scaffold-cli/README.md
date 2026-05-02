# platform/scaffold-cli

**Scope:** Project generator. `npx @cfxdevkit/create <template>`.

**Responsibilities**
- Template discovery from [../../templates/](../../templates/)
- Variable substitution
- Post-install setup (pnpm install, git init, env file)
- Optional integrations (wallet, MCP, devcontainer)
