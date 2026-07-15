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
- PI (Coding Agent) installed globally — `pi` binary available on PATH
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
| `28787` | Headroom compression proxy (between devcontainer and LLM) |

## Lemonade Server + Headroom Compression Proxy

Lemonade Server should keep running on the host workstation. On Linux, the
devcontainer requests host networking so `http://localhost:13305/` resolves to
the same Lemonade service inside and outside the container. It also keeps
`host.docker.internal` as a host-gateway alias for Docker backends; Podman hosts
usually provide `host.containers.internal` automatically.

All LLM traffic from the devcontainer flows through **Headroom**, a local context
compression proxy that sits between the devcontainer and Lemonade. Headroom
compresses tool outputs, logs, RAG chunks, and conversation history before they
reach the LLM — typically 60–95% fewer tokens with the same answers. The proxy
auto-starts on container start (port `28787`).

Use the proxy's OpenAI-compatible `/v1` surface from inside the devcontainer.
Pointing clients at the proxy root can cause Lemonade-native `/api/v1` discovery
to leak through, which bypasses Headroom's request telemetry and processing.

Architecture:
```
Devcontainer code → Headroom proxy (localhost:28787/v1) → Compress → Lemonade (host.containers.internal:13305)
```

To check what the devcontainer can see, run:

```bash
.devcontainer/scripts/check-lemonade.sh
```

If every endpoint fails but the host shell can reach Lemonade, the container is
still running with isolated networking. Rebuild the devcontainer rather than only
reloading VS Code, because `runArgs` only apply when the container is created.

## PI (Coding Agent)

PI is the interactive agent runtime for the repository. It is installed
**globally** in the devcontainer — the `pi` binary is available on PATH immediately
after post-create completes.

All PI configuration lives in `~/.pi/agent/` (not in the repository). This
includes provider settings, skills, prompts, and installed packages.

### Quick Start

```bash
# Start an interactive session
pi

# Once inside PI, run repository commands:
#   /repo-check [--dry-run] [--create-branch] [--quick]
#   /repo-commit [--quick] [--model <id>] [prompt]
#   /repo-run <action> [--quick] [--model <id>] [prompt]
#   /repo-actions [--deterministic|exploratory]
#   /cdk status [--chain <id|name>] [--rpc <url>]
#   /cdk derive --mnemonic "<phrase>" | --generate [--count N]
#   /cdk generate [--strength 128|256]
#   /cdk contracts extract [--artifacts <dir>] [--out <dir>]
```

### Single-Shot Prompts (Print Mode)

```bash
pi -p "Which validation commands should I run for a docs-only change?"
```

### Embedded/RPC Mode

```bash
pi --mode rpc
```

### Provider Configuration

Provider config is managed by PI in `~/.pi/agent/providers.json`. The default
provider points to the Headroom compression proxy at `http://localhost:28787/v1/`.

PI auto-discovers providers at common local URLs if not configured:
- `http://localhost:13305/`
- `http://host.docker.internal:13305/`
- `http://host.containers.internal:13305/`

After rebuilding or reopening the container, verify connectivity:

```bash
# Inside PI:
/repo-status
```

### Installing Additional PI Packages

```bash
# Install GitNexus PI tools (opt-in)

# Install any npm PI package
pi install npm:<package-name>
```

### Config Files (Global, Not in Repo)

| File | Purpose |
|------|---------|
| `~/.pi/agent/settings.json` | PI packages, providers, skills (auto-managed) |
| `~/.pi/agent/providers.json` | LLM endpoints, models, action overrides |
| `~/.pi/agent/dcp.json` | Dynamic Context Pruning configuration |
| `~/.pi/agent/skills/` | Versioned skills (copied from repo at post-create) |
| `~/.pi/agent/prompts/` | Versioned prompts (copied from repo at post-create) |
| `~/.pi/agent/npm/` | Installed PI packages (npm + local path refs) |
| `~/.pi/web-search.json` | Web search API keys (Exa, Perplexity, Gemini) |

### How It Works Under the Hood

1. **PI is installed globally** via `npm i -g @earendil-works/pi-coding-agent`
2. **The `pi-customization` package** is installed as a local PI package via `pi install`
   - This registers repo commands (`/repo-*`), tools (`repo_agent_check`, etc.),
     CDK commands (`/cdk`), and provider configuration
3. **Provider config** (`~/.pi/agent/providers.json`) is merged from the repo-local
   `.pi/providers.json` template and model overrides at post-create time
4. **Skills and prompts** from `.pi/skills/` and `.pi/prompts/` in the repo are
   copied to `~/.pi/agent/` at post-create time
5. **Web search API keys** from the devcontainer environment variables are written
   to `~/.pi/web-search.json`

### Troubleshooting

```bash
# Check if PI is installed and on PATH
command -v pi && pi --version

# Check installed PI packages
pi list

# Re-run post-create to rebuild PI config
.devcontainer/scripts/post-create.sh

# Check if Headroom proxy is reachable (required for local LLM)
curl -s http://localhost:28787/v1/models | head -5
```

## Notes

- On rootless Podman, the devcontainer publishes the local Caddy proxy on host port `8443` instead of `443`, because `pasta` cannot bind privileged host ports without extra host-level configuration. Use URLs like `https://showcase.dev.cfxdevkit.org:8443`.
- On rootless Podman (including `--userns=keep-id`), `--device-cgroup-rule` is not supported. USB passthrough is configured with a bind mount for `/dev/bus/usb`.
- Avoid `--device=/dev/bus/usb` with Podman for long-lived devcontainers; USB bus/device numbers can change across reconnects/reboots, and stale device nodes can block `podman start`.
- The devcontainer mounts the host Docker socket. Do not use it with an
  untrusted workspace.
- The older `devkit-workspace` backend and DEX processes are intentionally not
  started here because those features are outside the current root package
  scope.
