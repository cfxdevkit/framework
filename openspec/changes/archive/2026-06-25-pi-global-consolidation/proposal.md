# Proposal: PI Global Consolidation

## Why

PI (the coding agent harness) is installed as a transitive dependency buried in `repos/cfx-tools/infra/pi-agent`, wrapped in a TypeScript layer (`@cfxdevkit/pi-agent`) that adds ~500 lines of repo-specific commands, UI state, and provider bridges. The setup is convoluted:

- `cdk agent` (the supposed main entrypoint) is deprecated and never removed
- PI is expected globally in `.devcontainer/scripts/post-create.sh` but never actually installed
- `.pi/settings.json` has a circular entrypoint pointing to `cdk agent`
- Scope resolution via `CFXDEVKIT_PI_SCOPE` adds unnecessary complexity
- Skills live in both `.pi/skills/` AND `repos/cfx-tools/infra/pi-extensions/`
- The repo has 4 tightly-coupled infra packages (`pi-agent`, `pi-extensions`, `llm-agents`, `tooling-cli`) that could be consolidated
- Relative paths in `repo-agent.ts` reference `../../repos/cfx-tools/...` — fragile and non-portable
- **`.pi/` in the repo duplicates `~/.pi/agent/`** — config lives in two places, causing sync issues
- API keys and sensitive data end up in the repo's `.pi/` — wrong to version

This is a technical debt cleanup that makes PI behave exactly as designed: a global tool with ALL config in `~/.pi/agent/`, and repo-specific behavior delivered as a **pi package**.

## What Changes

1. **Install PI globally** in the devcontainer so `pi` is available on PATH
2. **Remove `cdk agent`** — the deprecated entrypoint is gone; `cdk` only serves the cdk package
3. **Create a proper pi customization package** — `@cfxdevkit/pi-customization` replaces the TypeScript wrapper layer. Installed globally via `pi install` (no `-l`) into `~/.pi/agent/npm/`
4. **Remove ALL `.pi/` from the repo** — no versioned config, no code, no skills, no prompts. Everything in `~/.pi/agent/`
5. **Remove scope complexity** — `CFXDEVKIT_PI_SCOPE` and scope-based config resolution go away
6. **Consolidate infra packages** — merge `pi-agent` + `pi-extensions` into `@cfxdevkit/pi-customization`

## Non-Goals

- Changing PI's core behavior or features (that belongs to `@earendil-works/pi-coding-agent`)
- Removing `llm-agents` entirely (it handles typed workflow agents separately)
- Removing `tooling-cli` (it has non-agent namespaces: keystore, contracts, docs)
- Removing `pi-web-access` (third-party package, already works correctly)

## Architecture Decision

### All PI config lives in `~/.pi/agent/`

PI's design: global config goes to `~/.pi/agent/`. Project-local config goes to `.pi/`. The repo should NOT have `.pi/` files at all.

```
~/.pi/agent/settings.json          ← ALL packages listed here
  "packages": [
    "./repos/cfx-tools/infra/pi-customization",   ← local path to repo package
    "npm:@davecodes/pi-dcp",                       ← third-party package
    "npm:pi-web-access"                            ← third-party package
  ]
~/.pi/agent/providers.json           ← provider config, API keys
  "provider": "openai-compat"
  "baseUrl": "http://localhost:28787/v1/"
  "defaultModel": "Qwen3.6-35B-A3B-MTP-GGUF-Q8_0"
  "modelOverrides": { ... }
  "actions": { "validation": "Gemma-4-26B-A4B-it-GGUF", ... }
~/.pi/agent/skills/                  ← skills (copied by devcontainer)
~/.pi/agent/prompts/                 ← prompts (copied by devcontainer)
~/.pi/agent/npm/                     ← installed pi packages (NOT in git)
  ├── @cfxdevkit/pi-customization/     ← installed from local path
  ├── @davecodes/pi-dcp/
  └── pi-web-access/
```

### pi-customization is installed as a local path

```
pi install /workspaces/root/repos/cfx-tools/infra/pi-customization
```

PI local paths: "point to files or directories on disk and are added to settings without copying."

This means:
1. No copying to `~/.pi/agent/npm/` — the package is referenced directly from the repo
2. Changes in the repo are picked up on `/reload`
3. The `pi` manifest in the package points to `./dist/index.js` (compiled)
4. The workspace build (`pnpm build`) compiles it

### What gets DELETED from the repo

```
.pi/                          ← ENTIRELY REMOVED
├── settings.json             ← → ~/.pi/agent/settings.json
├── providers.json            ← → ~/.pi/agent/providers.json
├── dcp.json                  ← → ~/.pi/agent/dcp.json
├── agent/
│   └── models.json           ← merged into ~/.pi/agent/providers.json
├── prompts/                  ← → ~/.pi/agent/prompts/
├── skills/                   ← → ~/.pi/agent/skills/
├── npm/                      ← → ~/.pi/agent/npm/
├── extensions/
│   └── repo-agent.ts
├── web-search.json           ← stays in ~/.pi/ (already user-local)
└── SETUP.md                  ← removed
```

### pi-web-access and pi-dcp placement

Both are third-party npm pi packages. They're installed correctly via `pi install npm:...`:
- `pi install npm:pi-web-access` → `~/.pi/agent/npm/pi-web-access/`
- `pi install npm:@davecodes/pi-dcp` → `~/.pi/agent/npm/@davecodes/pi-dcp/`

No changes needed — they already work correctly.

## Capabilities

### New Capabilities

- `pi-global-install`: PI installed globally in devcontainer, available as `pi` on PATH
- `pi-customization-package`: Repo customization as a proper pi package, installed globally
- `pi-config-global`: ALL PI config in `~/.pi/agent/`, no `.pi/` in repo

### Modified Capabilities

- `repo-command-surface`: `cdk agent` removed, remaining `cdk repo` commands work through direct module import
- `llm-agents`: No longer depends on `@cfxdevkit/pi-agent` (removes transitive pi dependency chain)

## Impact

- **Removes**: `@cfxdevkit/pi-agent` package, `@cfxdevkit/pi-extensions` package, `cdk agent` command, scope resolution, ENTIRE `.pi/` directory from repo
- **Creates**: `@cfxdevkit/pi-customization` package (pi package, proper workspace package)
- **Moves**: ALL PI config from `.pi/` → `~/.pi/agent/` (devcontainer post-create)
- **Keeps**: `llm-agents`, `tooling-cli` (non-agent namespaces), `pi-web-access` (third-party)
- **No external API changes** — `cdk repo` commands continue to work through direct imports
- **Devcontainer changes**: post-create.sh installs `pi` globally, installs packages, creates `~/.pi/agent/` config
