# Tasks: PI Global Consolidation

## Phase 1: Create pi-customization package

### Task 1.1: Scaffold pi-customization package structure

**Destination**: `repos/cfx-tools/infra/pi-customization/`

Create:
```
pi-customization/
├── package.json          ← name, keywords ["pi-package"], pi manifest, peer deps
├── moon.yml              ← layer: tool, dependsOn: llm-agents
├── vite.config.ts        ← same pattern as existing packages
├── tsconfig.json         ← same as pi-agent/tsconfig.json
├── src/
│   ├── index.ts          ← main extension entry point
│   ├── commands/
│   │   ├── repo.ts       ← repo commands
│   │   └── cdk.ts        ← cdk-specific commands (non-agent)
│   ├── tools/
│   │   ├── index.ts      ← tool exports
│   │   ├── commit.ts     ← commit workflow
│   │   └── action-runner.ts ← action runner
│   ├── ui/
│   │   ├── state.ts      ← progress tracking, gate widgets
│   │   └── widgets.ts    ← status bars, footers
│   └── providers.ts      ← provider resolution (uses PI's built-in)
└── README.md
```

**Requirements**: pi-extension-migration, pi-global-install
**Effort**: 4h

### Task 1.2: Migrate pi-agent/src/ contents to pi-customization/src/

Migrate all functionality from pi-agent into pi-customization, removing runtime wrappers and config file reading.

| pi-agent/src/* | → pi-customization/src/* | Notes |
|---|---|---|
| `extension.ts` | `src/index.ts` | Merge, remove PiAgentExtension type |
| `commands/cdk.ts` | `src/commands/cdk.ts` | Keep, remove cdk agent |
| `commands.ts` | `src/commands/repo.ts` | Keep |
| `providers.ts` | `src/providers.ts` | Use PI's built-in resolution (no file reading) |
| `runtime.ts` | REMOVED | PI handles interactive/print/RPC natively |
| `tools.ts` | `src/tools/index.ts` | Keep |
| `ui.ts` | `src/ui/state.ts` + `src/ui/widgets.ts` | Split |
| `llm-agents-runtime.ts` | REMOVED | Import directly from llm-agents |
| `tooling-runtime.ts` | REMOVED | No config file reading |

**Requirements**: pi-extension-migration
**Effort**: 6h

### Task 1.3: Build and verify pi-customization compiles

- **WHEN** `vite build` is run in the package directory
- **THEN** it produces `dist/index.js` and `dist/index.d.ts`
- **THEN** the build completes without errors
- **WHEN** `tsc --noEmit` is run
- **THEN** no type errors

**Requirements**: pi-extension-migration
**Effort**: 1h

## Phase 2: Remove cdk agent

### Task 2.1: Remove agent subcommand from tooling-cli/bin.ts

**File**: `repos/cfx-tools/infra/tooling-cli/src/bin.ts`

Remove the `agent` command registration and all agent-related namespace groups.

**Requirements**: pi-agent-removal
**Effort**: 2h

### Task 2.2: Remove tooling-cli/src/agent-session/

**Files**: `repos/cfx-tools/infra/tooling-cli/src/agent-session/setup.ts`
**Files**: `repos/cfx-tools/infra/tooling-cli/src/agent-session/setup.test.ts`

Delete the entire `agent-session/` directory.

**Requirements**: pi-agent-removal
**Effort**: 0.5h

### Task 2.3: Remove pi-agent dependency from tooling-cli/package.json

**File**: `repos/cfx-tools/infra/tooling-cli/package.json`

Remove `@cfxdevkit/pi-agent` from dependencies.

**Requirements**: pi-agent-removal
**Effort**: 0.5h

### Task 2.4: Update tooling-cli package.json scripts

Remove `agent` and `agent-commit` scripts:
```json
"scripts": {
  "agent": "pnpm --filter @cfxdevkit/llm-agents agent-chat",  // REMOVE
  "agent-commit": "pnpm --filter @cfxdevkit/llm-agents agent-commit"  // REMOVE
}
```

**Requirements**: pi-agent-removal
**Effort**: 0.5h

## Phase 3: Update llm-agents

### Task 3.1: Remove pi-agent dependency from llm-agents/package.json

**File**: `repos/cfx-tools/infra/llm-agents/package.json`

Remove `"@cfxdevkit/pi-agent": "workspace:*"` from dependencies.

**Requirements**: pi-agent-removal
**Effort**: 0.5h

### Task 3.2: Update llm-agents imports from pi-agent

Replace imports that go through pi-agent with direct imports.

**Before**: `import { ... } from '@cfxdevkit/pi-agent'`
**After**: `import { ... } from '@earendil-works/pi-coding-agent'` (for PI types)
**After**: Direct relative imports within llm-agents (for repo utilities)

**Requirements**: pi-agent-removal
**Effort**: 2h

### Task 3.3: Add pi-coding-agent as peer dependency in llm-agents

**File**: `repos/cfx-tools/infra/llm-agents/package.json`

Add `@earendil-works/pi-coding-agent` as a peerDependency with `"*"` range.

**Requirements**: pi-global-install (indirectly — llm-agents also uses PI)
**Effort**: 0.5h

## Phase 4: Update devcontainer — create ~/.pi/agent/

### Task 4.1: Update .devcontainer/scripts/post-create.sh

Add:
```bash
# Install PI globally (target: ~/.pi/agent/)
npm i -g --ignore-scripts @earendil-works/pi-coding-agent@0.79.10

# Build workspace (includes pi-customization)
pnpm install
pnpm build

# Install pi-customization as local path → ~/.pi/agent/settings.json
pi install /workspaces/root/repos/cfx-tools/infra/pi-customization

# Install third-party packages → ~/.pi/agent/npm/
pi install npm:@davecodes/pi-dcp
pi install npm:pi-web-access
```

Remove:
- The old `if command -v pi` conditional check (PI now always exists)
- The conditional `pi install` block that was already broken
- Any `mkdir -p .pi/` commands (replaced with `~/.pi/agent/`)

**Requirements**: pi-global-install
**Effort**: 2h

### Task 4.2: Create ~/.pi/agent/providers.json

Migrate from `.pi/providers.json` + `.pi/agent/models.json`:

```json
{
  "provider": "openai-compat",
  "baseUrl": "http://localhost:28787/v1/",
  "defaultModel": "Qwen3.6-35B-A3B-MTP-GGUF-Q8_0",
  "modelOverrides": {
    "Qwen3.6-35B-A3B-MTP-GGUF-Q8_0": {
      "contextWindow": 262144,
      "maxTokens": 235929
    }
  },
  "actions": {
    "validation": "Gemma-4-26B-A4B-it-GGUF",
    "docs-api": "Qwen3.6-35B-A3B-MTP-GGUF-Q8_0",
    "commit": "Qwen3.6-35B-A3B-MTP-GGUF-Q8_0",
    "review": "Qwen3.6-35B-A3B-MTP-GGUF-Q8_0",
    ...
  }
}
```

Create `~/.pi/agent/` directory and write this file in post-create.sh.

**Requirements**: pi-config-global
**Effort**: 1h

### Task 4.3: Copy skills and prompts to ~/.pi/agent/

In post-create.sh:
```bash
# Copy skills to ~/.pi/agent/skills/
mkdir -p ~/.pi/agent/skills
# Copy each skill from the repo

# Copy prompts to ~/.pi/agent/prompts/
mkdir -p ~/.pi/agent/prompts
# Copy each prompt
```

**Requirements**: pi-config-global
**Effort**: 1h

### Task 4.4: Handle existing ~/.pi/agent/settings.json

The `pi install` commands automatically append to the existing `~/.pi/agent/settings.json`. No manual file creation needed — PI handles it.

**Requirements**: pi-config-global
**Effort**: 0.5h

### Task 4.5: Ensure ~/.pi/ is NOT versioned

Verify that `~/.pi/` is not referenced in any `.gitignore` in the repo (it's outside the repo anyway).

**Requirements**: pi-agent-removal
**Effort**: 0.5h

## Phase 5: Remove old packages and .pi/ from repo

### Task 5.1: Remove pi-agent directory

**Directory**: `repos/cfx-tools/infra/pi-agent/`

Delete the entire directory including all src/, dist/, config files.

**Requirements**: pi-agent-removal
**Effort**: 1h

### Task 5.2: Remove pi-extensions directory

**Directory**: `repos/cfx-tools/infra/pi-extensions/`

Delete the entire directory.

**Requirements**: pi-agent-removal
**Effort**: 1h

### Task 5.3: Remove .pi/ directory from repo

**Directory**: `.pi/`

Delete the ENTIRE `.pi/` directory.

**Requirements**: pi-agent-removal
**Effort**: 1h

### Task 5.4: Update pnpm-workspace.yaml

**File**: `pnpm-workspace.yaml`

Remove:
- `repos/cfx-tools/infra/pi-agent` (if listed)
- `repos/cfx-tools/infra/pi-extensions` (if listed)

Add:
- `repos/cfx-tools/infra/pi-customization`

Keep:
- `repos/cfx-tools/infra/llm-agents`
- `repos/cfx-tools/infra/tooling-cli`

**Requirements**: pi-agent-removal
**Effort**: 0.5h

### Task 5.5: Update moon.yml files

Remove `pi-agent` from dependsOn in any moon.yml that references it. Add `pi-customization` where needed.

**Files to check**:
- `tooling-cli/moon.yml`
- `llm-agents/moon.yml`

**Requirements**: pi-agent-removal
**Effort**: 1h

## Phase 6: Cleanup and verification

### Task 6.1: Update README files

Update:
- `repos/cfx-tools/README.md` — remove cdk agent from package table
- `repos/cfx-tools/infra/tooling-cli/README.md` — remove cdk agent entrypoint
- Any docs that reference `cdk agent` or `.pi/`

**Requirements**: pi-agent-removal
**Effort**: 1h

### Task 6.2: Update openspec skills

Move `.pi/skills/openspec-*` into pi-customization as a pi package skill directory, OR keep the skill markdown files in `repos/cfx-tools/infra/pi-customization/skills/` (which PI auto-discovers).

**Requirements**: pi-extension-migration
**Effort**: 0.5h

### Task 6.3: Verify all tests pass

Run:
```bash
pnpm test
```

Ensure no tests reference `@cfxdevkit/pi-agent`, `cdk agent`, `CFXDEVKIT_PI_SCOPE`, or `.pi/`.

**Requirements**: All specs
**Effort**: 2h

### Task 6.4: Verify typecheck passes

Run:
```bash
pnpm typecheck
```

Ensure no type errors from removed packages or updated imports.

**Requirements**: All specs
**Effort**: 1h

### Task 6.5: Verify devcontainer post-create runs end-to-end

Test in devcontainer:
```bash
.devcontainer/scripts/post-create.sh
```

Verify:
- `pi --version` works
- `cdk repo --help` works
- `cdk agent --help` returns "not found"
- PI loads pi-customization extension
- `~/.pi/agent/settings.json` contains all packages
- `~/.pi/agent/providers.json` exists
- `~/.pi/agent/skills/` exists
- `pi list` shows installed packages

**Requirements**: pi-global-install, pi-config-global
**Effort**: 2h

## Total Effort: ~35.5 hours

| Phase | Tasks | Hours |
|-------|-------|-------|
| 1. Create pi-customization package | 3 | 11 |
| 2. Remove cdk agent | 4 | 3.5 |
| 3. Update llm-agents | 3 | 3 |
| 4. Create ~/.pi/agent/ in devcontainer | 5 | 5 |
| 5. Remove old packages + .pi/ from repo | 5 | 5.5 |
| 6. Cleanup and verification | 5 | 6.5 |
| **Total** | **25** | **35.5** |
