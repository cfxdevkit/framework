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
- Native search tools available in the base image, including `rg` and `fd`
- Docker CLI access through the host Docker socket for compose/image workflows
- GitHub CLI for repository automation
- GitNexus CLI from the workspace dependency, registered on container start
- Local Conflux node workflows through `@cfxdevkit/devnode`
- VS Code extension development for `cfxdevkit.cfxdevkit-vscode-extension`
- Workspace-local `.cfxdevkit/` state for keystores, deployments, and devnode data

## First Boot

Open the repository in a Dev Container. The `postCreateCommand` runs:

```bash
pnpm install --frozen-lockfile
pnpm --filter cfxdevkit-vscode-extension... build
.devcontainer/scripts/install-vscode-extension.sh --build
openspec init --tools pi   # only when openspec is present and .pi bootstrap is missing
```

That builds the new extension package plus its framework dependencies, then
symlinks it into the remote VS Code extension directories so the node,
keystore, compiler, wallet, and contract deployment flows are available inside
the editor. When the workspace already contains `openspec/` but has not been
bootstrapped for PI yet, the post-create script also runs `openspec init --tools pi`
once so the repo-local `.pi/` prompts, skills, and extension entrypoint exist.

## Common Commands

```bash
pnpm build
pnpm test
pnpm lint
pnpm devnode
pnpm --filter cfxdevkit-vscode-extension typecheck
pnpm --filter cfxdevkit-vscode-extension build
pnpm exec gitnexus analyze
pnpm exec gitnexus list
```

Use `pnpm exec gitnexus ...` rather than `npx gitnexus ...` in this workspace.
The root package manager settings are pnpm-specific, and npm/npx will warn about
those settings even though pnpm handles them correctly.

## Forwarded Ports

| Port | Purpose |
|------|---------|
| `8443` | Local HTTPS reverse proxy (host port -> container `443`) |
| `12537` | Conflux Core RPC |
| `12536` | Conflux Core WebSocket |
| `8545` | Conflux eSpace RPC |
| `8546` | Conflux eSpace WebSocket |
| `5173` | Vite dev server |
| `4173` | Vite preview |
| `3000` | App server |
| `7748` | Legacy DevKit backend compatibility port |
| `8787` | Worker/backend dev server |

## Lemonade Server

Lemonade Server should keep running on the host workstation. On Linux, the
devcontainer requests host networking so `http://localhost:13305/` resolves to
the same Lemonade service inside and outside the container. It also keeps
`host.docker.internal` as a host-gateway alias for Docker backends; Podman hosts
usually provide `host.containers.internal` automatically.

After rebuilding or reopening the container, verify connectivity:

```bash
pnpm run llm:models
pnpm run llm:ask -- --quick "Is Lemonade reachable from the devcontainer?"
```

If your container backend cannot use host networking, start Lemonade so it binds
outside host loopback or pin a reachable host URL locally:

```bash
pnpm run llm:config -- set base-url http://<host-ip>:13305/
```

To check what the devcontainer can see, run:

```bash
.devcontainer/scripts/check-lemonade.sh
```

If every endpoint fails but the host shell can reach Lemonade, the container is
still running with isolated networking. Rebuild the devcontainer rather than only
reloading VS Code, because `runArgs` only apply when the container is created.

## PI Runtime Prerequisites

The base image now installs `fd` at build time through Debian's `fd-find` package
and a compatibility symlink. That avoids PI's first-run fallback download path and
keeps `cdk agent interactive|print|rpc` startup deterministic inside fresh containers.

If you want PI to expose GitNexus as first-class tools through
`pi-gitnexus`, set `CFXDEVKIT_INSTALL_PI_GITNEXUS=1` before the container's
post-create run or rerun `.devcontainer/scripts/post-create.sh` with that
environment variable. This stays opt-in because it installs external PI state
and depends on GitNexus licensing/policy being acceptable for the environment.

## Notes

- On rootless Podman, the devcontainer publishes the local Caddy proxy on host port `8443` instead of `443`, because `pasta` cannot bind privileged host ports without extra host-level configuration. Use URLs like `https://showcase.dev.cfxdevkit.org:8443`.
- The devcontainer mounts the host Docker socket. Do not use it with an
  untrusted workspace.
- The older `devkit-workspace` backend and DEX processes are intentionally not
  started here because those features are outside the current root package
  scope.