# Root Devcontainer

This devcontainer is the root workspace environment for the modular
`@cfxdevkit/*` monorepo. It follows the same intent as the older
`devkit-workspace` target architecture — one container with Node, pnpm, Moon,
Docker CLI access, GitHub CLI, and editor tooling — but it does not depend on
the old packaged backend, DEX UI, or prebuilt VSIX artifacts.

## Target Host

The primary local target is a Strix Halo workstation with an AMD Ryzen AI Max+
395, 128 GB of RAM, Fedora 43, Podman, and Toolbx / Toolbox containers. The
root devcontainer remains Docker-compatible for VS Code Dev Containers, but
repository infrastructure planning should assume Podman and Toolbx as the Fedora
host baseline.

## What It Enables

- Node `24.x`, pnpm `10.33.2`, Moon `2.2.3`, TypeScript `6`, Vite `8`, Vitest `4`, and Biome `2`
- Docker CLI access through the host Docker socket for compose/image workflows
- GitHub CLI for repository automation
- GitNexus CLI from the workspace dependency
- Local Conflux node workflows through `@cfxdevkit/devnode`
- VS Code extension development for `cfxdevkit.cfxdevkit-vscode-extension`
- Workspace-local `.cfxdevkit/` state for keystores, deployments, and devnode data

## First Boot

Open the repository in a Dev Container. The `postCreateCommand` runs:

```bash
pnpm install --frozen-lockfile
pnpm --filter cfxdevkit-vscode-extension... build
.devcontainer/scripts/install-vscode-extension.sh --build
```

That builds the new extension package plus its framework dependencies, then
symlinks it into the remote VS Code extension directories so the node,
keystore, compiler, wallet, and contract deployment flows are available inside
the editor.

## Common Commands

```bash
pnpm build
pnpm test
pnpm lint
pnpm devnode
pnpm --filter cfxdevkit-vscode-extension typecheck
pnpm --filter cfxdevkit-vscode-extension build
pnpm gitnexus analyze
```

## Forwarded Ports

| Port | Purpose |
|------|---------|
| `12537` | Conflux Core RPC |
| `12536` | Conflux Core WebSocket |
| `8545` | Conflux eSpace RPC |
| `8546` | Conflux eSpace WebSocket |
| `5173` | Vite dev server |
| `4173` | Vite preview |
| `3000` | App server |
| `7748` | Legacy DevKit backend compatibility port |
| `8787` | Worker/backend dev server |

## Notes

- The devcontainer mounts the host Docker socket. Do not use it with an
  untrusted workspace.
- The older `devkit-workspace` backend and DEX processes are intentionally not
  started here because those features are outside the current root package
  scope.