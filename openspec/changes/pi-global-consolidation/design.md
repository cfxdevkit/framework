# Design: PI Global Consolidation

## Current State

```
┌──────────────────────────────────────────────────────────────────┐
│  ROOT MONOREPO (has .pi/ folder)                                  │
│  pnpm-workspace.yaml → includes repos/cfx-tools/infra/*          │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  @cfxdevkit/tooling-cli (repos/cfx-tools/infra/tooling-cli/)    │
│  Bin: cdk, cfx-tooling                                           │
│  ├── "cdk agent" ← DEPRECATED, loops back to pi-agent           │
│   └── "cdk repo" ← still needed                                  │
│  Depends on: @cfxdevkit/pi-agent (workspace)                     │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  @cfxdevkit/pi-agent (repos/cfx-tools/infra/pi-agent/)           │
│  TypeScript wrapper around PI (500+ lines)                        │
│  - registerPiCdkCommands()  → "cdk agent" commands               │
│  - registerPiRepoCommands() → repo tools & workflows             │
│  - registerPiRepoTools()    → commit workflow, action runner     │
│  - createPiProviderBridge() → reads .pi/providers.json          │
│  - runPiInteractive/print/RPC() → spawn PI subprocess            │
│  Depends on:                                                       │
│    @earendil-works/pi-coding-agent (npm)                          │
│    @earendil-works/pi-tui (npm)                                   │
│    @cfxdevkit/cli (workspace)                                     │
│    @cfxdevkit/llm-agents (workspace)                              │
│    @cfxdevkit/workspace-utils (workspace)                         │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  @cfxdevkit/pi-extensions (repos/cfx-tools/infra/pi-extensions/)  │
│  PI extensions: 00-session-state, 01-prompt-customizer            │
└──────────────────────────────────────────────────────────────────┘

.pi/settings.json:
  runtime.entrypoint: "cdk agent" ← CIRCULAR
  controlPlane: "cdk"
  packages: [npm:@davecodes/pi-dcp, ./repos/cfx-tools/infra/pi-extensions]
  skills: [".pi/skills", "./repos/cfx-tools/infra/pi-extensions/skills"]

.pi/providers.json:       ← provider config
.pi/agent/models.json:    ← model overrides
.pi/skills/               ← skills (versioned in repo)
.pi/prompts/              ← prompts (versioned in repo)
.pi/npm/                  ← installed packages (not in git)

.devcontainer/post-create.sh:
  - Checks: command -v pi (PI NOT actually installed)
  - pi install npm:pi-web-access (runs but fails because pi isn't there)
  - Copies librarian skill to .pi/skills/
```

### The Four Problems

**Problem 1: PI is a transitive dependency**
PI lives 3 hops deep: tooling-cli → pi-agent → pi-coding-agent. No `pi` binary on PATH.

**Problem 2: Circular entrypoint**
.pi/settings.json → runtime.entrypoint: "cdk agent"
tooling-cli → "cdk agent" → pi-agent → spawns pi → reads .pi/settings.json

**Problem 3: TypeScript wrapper layer**
`@cfxdevkit/pi-agent` adds ~500 lines of repo customization. This should be a pi package.

**Problem 4: Config in two places**
```
.pi/          ← repo-local (versioned, but has secrets)
  ├── settings.json
  ├── providers.json
  ├── skills/
  └── npm/

~/.pi/agent/  ← global (user-level, managed by devcontainer scripts)
  ├── extensions/
  ├── npm/
  └── (partial settings)
```
API keys end up in `.pi/web-search.json` which is versioned. Config is duplicated between repo `.pi/` and user `~/.pi/agent/`.

## Target State

```
┌──────────────────────────────────────────────────────────────────┐
│  ROOT MONOREPO (NO .pi/ folder)                                   │
│  pnpm-workspace.yaml → includes repos/cfx-tools/infra/*          │
│                                                                    │
│  repos/cfx-tools/infra/                                           │
│    ├── pi-customization/            ← NEW: pi package             │
│    │   ├── package.json             ← name: pi-customization      │
│    │   ├── pi: { extensions: ["./dist/index.js"] }               │
│    │   ├── peerDependencies: {                                    │
│    │   │   "@earendil-works/pi-coding-agent": "*",               │
│    │   │   "@earendil-works/pi-tui": "*",                        │
│    │   │   "typebox": "*"                                        │
│    │   │ }                                                         │
│    │   └── src/index.ts            ← registerRepoPiExtension      │
│    ├── llm-agents/               ← kept (typed workflow agents)   │
│    ├── tooling-cli/              ← kept (cdk repo, contracts)     │
│    ├── pi-agent/                 ← REMOVED                        │
│    └── pi-extensions/            ← REMOVED (merged)               │
│                                                                    │
│  .devcontainer/                                                   │
│    ├── post-create.sh:                                            │
│    │   ├── npm i -g pi-coding-agent@0.79.10                       │
│    │   ├── pnpm install                                           │
│    │   ├── pnpm build (builds pi-customization)                   │
│    │   ├── pi install /workspaces/root/repos/cfx-tools/infra/    │
│    │   │                      pi-customization    │
│    │   ├── pi install npm:@davecodes/pi-dcp                       │
│    │   ├── pi install npm:pi-web-access                           │
│    │   ├── mkdir -p ~/.pi/agent/                                  │
│    │   │   ├── providers.json       ← provider config, keys       │
│    │   │   ├── dcp.json             ← dcp config                  │
│    │   │   ├── skills/              ← skills                      │
│    │   │   └── prompts/             ← prompts                     │
│    │   └── cp .pi/... → ~/.pi/agent/...  (if .pi/ had templates) │
│    └── Dockerfile: Node.js + pnpm (already present)               │
│                                                                    │
│  ~/.pi/agent/          ← SINGLE source of truth for PI             │
│    ├── settings.json      ← packages, providers, skills           │
│    ├── providers.json     ← endpoint, models, actions, API keys   │
│    ├── dcp.json           ← dcp config                            │
│    ├── skills/            ← skills (versioned from repo)          │
│    ├── prompts/           ← prompts (versioned from repo)         │
│    ├── npm/               ← installed pi packages (NOT in git)    │
│    │   ├── @cfxdevkit/pi-customization/  ← local path reference   │
│    │   ├── @davecodes/pi-dcp/             ← npm package           │
│    │   └── pi-web-access/               ← npm package             │
│    └── trust.json         ← project trust decisions               │
└──────────────────────────────────────────────────────────────────┘
```

## Detailed Design: pi-customization Package

### Package Structure

```
repos/cfx-tools/infra/pi-customization/
├── package.json
│   {
│     "name": "@cfxdevkit/pi-customization",
│     "version": "1.0.0",
│     "type": "module",
│     "description": "PI customization package for Conflux DevKit",
│     "keywords": ["pi-package"],
│     "files": ["dist", "README.md"],
│     "main": "./dist/index.js",
│     "types": "./dist/index.d.ts",
│     "pi": {
│       "extensions": ["./dist/index.js"]
│     },
│     "scripts": {
│       "build": "vite build",
│       "typecheck": "tsc --noEmit",
│       "lint": "biome check src"
│     },
│     "dependencies": {
│       "@cfxdevkit/llm-agents": "workspace:*"
│     },
│     "peerDependencies": {
│       "@earendil-works/pi-coding-agent": "*",
│       "@earendil-works/pi-tui": "*",
│       "typebox": "*"
│     }
│   }
├── moon.yml
│   {
│     "$schema": "https://moonrepo.dev/schemas/project.json",
│     "name": "pi-customization",
│     "kind": "tool",
│     "language": "typescript",
│     "dependsOn": ["llm-agents"],
│     "plugins": { "@moonrepo/node-plugin": {} }
│   }
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── index.ts          ← main extension entry point
│   ├── commands/
│   │   ├── repo.ts       ← commit workflow, action runner
│   │   └── cdk.ts        ← cdk-specific commands (non-agent)
│   ├── tools/
│   │   ├── commit.ts     ← executePiCommitSession
│   │   ├── action-runner.ts ← executePiRepoAction
│   │   └── cdks.ts       ← executeCdkContractsExtract, etc.
│   ├── ui/
│   │   ├── state.ts      ← progress tracking, gate widgets
│   │   └── widgets.ts    ← status bars, footers
│   └── providers.ts      ← provider resolution (uses PI's built-in)
└── README.md
```

### Migration Map: pi-agent → pi-customization

| pi-agent/src/* | → pi-customization/src/* | Notes |
|---|---|---|
| `extension.ts` | `src/index.ts` | Merge, remove PiAgentExtension type |
| `commands/cdk.ts` | `src/commands/cdk.ts` | Keep, remove cdk agent |
| `commands.ts` | `src/commands/repo.ts` | Keep |
| `providers.ts` | `src/providers.ts` | Use PI's built-in resolution |
| `runtime.ts` | REMOVED | PI handles interactive/print/RPC natively |
| `tools.ts` | `src/tools/index.ts` | Keep |
| `ui.ts` | `src/ui/state.ts` + `src/ui/widgets.ts` | Split |
| `llm-agents-runtime.ts` | REMOVED | Import directly from `@cfxdevkit/llm-agents` |
| `tooling-runtime.ts` | REMOVED | No more reading config files |

### How `pi install` Works in Devcontainer

```bash
# 1. Install PI globally (default target: ~/.pi/agent/)
npm i -g @earendil-works/pi-coding-agent@0.79.10

# 2. Build workspace (includes pi-customization)
pnpm install
pnpm build

# 3. Install pi-customization as local path → ~/.pi/agent/settings.json
pi install /workspaces/root/repos/cfx-tools/infra/pi-customization
# → PI adds the local path to
#   ~/.pi/agent/settings.json packages array
# → Local paths are NOT copied — PI references the repo path directly
# → /reload picks up changes immediately

# 4. Install third-party packages → ~/.pi/agent/npm/
pi install npm:@davecodes/pi-dcp
pi install npm:pi-web-access
# → Copied to ~/.pi/agent/npm/
# → Added to ~/.pi/agent/settings.json packages array
```

### How the Extension Works (No Config Reading)

The old pi-agent extension read config files directly (`readFileSync('.pi/providers.json')`). This is wrong — PI already resolves providers. The extension should use PI's built-in resolution:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { getActionDefinitions } from "@cfxdevkit/llm-agents";

export default function registerRepoPiExtension(pi: ExtensionAPI) {
  // No config reading needed — PI already resolved providers

  // Register repo commands
  pi.registerCommand("repo-commit", {
    description: "Run the repo commit workflow",
    handler: async (args, ctx) => {
      // ctx.model has the resolved model
      // ctx.model.provider has the resolved provider
    },
  });

  // Register repo tools
  pi.registerTool({
    name: "repo_commit_workflow",
    description: "Run commit workflow",
    parameters: Type.Object({}),
    async execute(args, ctx) {
      // Use PI's built-in provider (no config file reading)
    },
  });

  // Register UI state
  pi.on("session_start", async (_event, ctx) => {
    // Set up widgets, status bars
  });
}
```

### What Gets Removed (No Longer Needed)

| Component | Why Removed |
|---|---|
| `@cfxdevkit/pi-agent` package | Replaced by pi-customization pi package |
| `@cfxdevkit/pi-extensions` package | Merged into pi-customization |
| `cdk agent` command | Deprecated, never removed |
| `runPiInteractive/Print/RPC()` | PI handles these natively |
| `CFXDEVKIT_PI_SCOPE` | Unnecessary complexity |
| `llm-agents-runtime.ts` imports | → direct `@cfxdevkit/llm-agents` imports |
| `tooling-cli` → `pi-agent` dependency | → pi-customization is a pi package |
| `tooling-cli` → `agent-session/` | Agent session setup is PI's responsibility |
| **ENTIRE `.pi/` directory** | All config moved to `~/.pi/agent/` |

### pi-web-access in the Dependency Tree

```
@earendil-works/pi-coding-agent  ← PI core (global)
  └── @earendil-works/pi-tui     ← PI TUI components (global)

pi-customization (pi package, local path)
  ├── peer: @earendil-works/pi-coding-agent
  ├── peer: @earendil-works/pi-tui
  ├── peer: typebox
  └── dep: @cfxdevkit/llm-agents

pi-web-access (third-party npm pi package)
  → ~/.pi/agent/npm/pi-web-access/
  → skills symlinked into ~/.pi/agent/skills/librarian/

pi-dcp (third-party npm pi package)
  → ~/.pi/agent/npm/@davecodes/pi-dcp/
```

PI TUI is a **peer dependency** of `pi-customization`, not a runtime dependency. PI TUI is already provided by the global PI installation.

### File System Changes Summary

```
REMOVED from repo:
  .pi/                          ← entire directory gone
  repos/cfx-tools/infra/pi-agent/
  repos/cfx-tools/infra/pi-extensions/
  repos/cfx-tools/infra/tooling-cli/src/agent-session/

CREATED in repo:
  repos/cfx-tools/infra/pi-customization/

CREATED by devcontainer:
  ~/.pi/agent/settings.json
  ~/.pi/agent/providers.json
  ~/.pi/agent/dcp.json
  ~/.pi/agent/skills/
  ~/.pi/agent/prompts/
  ~/.pi/agent/npm/
```
