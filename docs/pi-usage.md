# PI (Coding Agent) Usage Guide

This guide explains how to use PI for repository development, testing, and
debugging workflows.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Devcontainer                                                    │
│                                                                  │
│  pi (global binary)                                              │
│    ├── @earendil-works/pi-coding-agent  ← PI core (npm global)  │
│    └── @cfxdevkit/pi-customization     ← repo customizations    │
│         ├── /repo-* commands                                       │
│         ├── /cdk commands                                          │
│         └── repo_agent_check, repo_run_action, etc.              │
│                                                                  │
│  ~/.pi/agent/  ← ALL PI configuration                          │
│    ├── settings.json                                              │
│    ├── providers.json                                             │
│    ├── dcp.json                                                   │
│    ├── skills/                                                    │
│    └── prompts/                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key principle:** PI is a global tool. Configuration lives in `~/.pi/agent/`
— nothing PI-related is versioned in the repository (except the PI customization
package source code and config templates).

## Starting PI

### Interactive Mode (Terminal)

```bash
# Start an interactive session with the repository extension loaded
pi
```

Once inside PI, you can use slash commands (see below) and PI's built-in tools.

### Print Mode (Single-Shot Prompt)

```bash
# Ask a question without entering interactive mode
pi -p "Which validation commands should I run for a docs-only change?"

# Ask with a longer prompt (use -- to separate prompt from options)
pi -p -- "Explain the changes in this commit and suggest improvements"
```

### RPC Mode (Embedded)

```bash
# Run PI as an RPC server for editor/dashboard integrations
pi --mode rpc
```

### Model Override

```bash
# Use a specific model for a single-shot prompt
pi -p --model Qwen3.6-35B-A3B-MTP-GGUF-Q8_0 "What's the status of the CI pipeline?"
```

## Repository Commands (Inside PI)

These commands are registered by `@cfxdevkit/pi-customization` and are available
in every interactive PI session.

### `/repo-check` — Repository Validation

Runs the full repo validation pipeline and creates OpenSpec changes if needed.

```bash
/repo-check                     # Full validation with branch creation
/repo-check --dry-run           # Plan changes without writing files
/repo-check --quick             # Reduce context for faster execution
```

**What it does:**
- Runs all validation steps (typecheck, lint, test, moon build)
- Creates OpenSpec change artifacts for any failing steps
- Optionally creates a git branch with the planned changes

### `/repo-commit` — Interactive Commit Workflow

Runs the commit workflow with gate UI, remediation guidance, and approval state.

```bash
/repo-commit                     # Interactive commit with TUI gates
/repo-commit --quick             # Reduce context
/repo-commit --model Qwen3.6     # Use a specific model
/repo-commit "feat: update README"  # Provide commit message hint
```

**What it does:**
- Detects changed scopes and release intent
- Runs repository policy gates (lint, typecheck, etc.)
- Runs quality gates (tests, docs checks)
- Generates a commit message with LLM assistance
- Shows gate UI for review/approval
- Commits changes (non-exiting — stays in PI session)

### `/repo-run` — Run a Specific Repo Action

Executes a named workflow from the shared repo action registry.

```bash
/repo-run review                 # Review current git diff
/repo-run validation             # Pick targeted validation commands
/repo-run changeset              # Review Changesets and bump levels
/repo-run ci-cd                  # Review CI/CD workflows
/repo-run docs-pipeline          # Review docs deploy readiness
/repo-run release-readiness      # Review release readiness
```

Available actions are listed via `/repo-actions`.

### `/repo-actions` — List Available Actions

```bash
/repo-actions                    # Show all available actions
/repo-actions deterministic      # Filter to deterministic mode
/repo-actions exploratory        # Filter to exploratory mode
```

### `/repo-status` — Show Current Context

Displays the current provider, model, scope, and available workflows.

```bash
/repo-status
```

### `/cdk` — Conflux Developer CLI Commands

Deterministic commands that call `@cfxdevkit/cli` pure functions. No LLM involved.

```bash
# Check node health
/cdk status [--chain <id|name>] [--rpc <url>]

# Derive wallet keys from mnemonic
/cdk derive --mnemonic "<phrase>" [--count N] [--generate]

# Generate random mnemonic
/cdk generate [--strength 128|256]

# Extract contract ABIs
/cdk contracts extract [--artifacts <dir>] [--out <dir>]
```

## Using PI Tools (Programmatically)

PI tools can be invoked from within any PI session or via the `repo_run_action`
tool. They are also available in the OpenSpec change planning pipeline.

### `repo_agent_check` — Run Repo Validation

```typescript
// From within a PI session
repo_agent_check({ dryRun: true, createBranch: true, quick: false })
```

**Returns:** Validation status, actionable steps, created changes, and
follow-up actions (branch creation, PR draft).

### `repo_run_action` — Run a Typed Workflow

```typescript
// From within a PI session
repo_run_action({
  action: "review",
  prompt: "Focus on security implications",
  quick: false,
  model: "Qwen3.6-35B-A3B-MTP-GGUF-Q8_0"
})
```

### `repo_commit_workflow` — Non-Exiting Commit

```typescript
// From within a PI session
repo_commit_workflow({
  prompt: "Fix: update package versions",
  quick: false,
  model: "Qwen3.6"
})
```

This runs the commit workflow without exiting PI — you stay in session to
review the result and continue working.

## Testing the New Structure

### Verify PI is Installed

```bash
# Should return a version number
command -v pi && pi --version

# Expected: 0.79.10
```

### Verify PI Config Exists

```bash
# All these should exist
ls ~/.pi/agent/settings.json
ls ~/.pi/agent/providers.json
ls ~/.pi/agent/dcp.json
```

### Verify PI Extension is Loaded

```bash
# Start PI and run a repo command
pi /repo-status
# Should show provider, model, and available actions
```

### Verify Provider Configuration

```bash
# Check the providers.json content
cat ~/.pi/agent/providers.json | python3 -m json.tool | head -20

# Should show:
# - provider: "openai-compat"
# - baseUrl: "http://localhost:28787/v1/"
# - defaultModel: "Qwen3.6-35B-A3B-MTP-GGUF-Q8_0"
# - modelOverrides (if any)
```

### Verify Skills Are Installed

```bash
ls ~/.pi/agent/skills/
# Should include: framework-check, gitnexus, openspec-*, pi-dcp, librarian
```

### Verify Web Search API Keys

```bash
cat ~/.pi/web-search.json | python3 -m json.tool
# Should show exaApiKey, perplexityApiKey, geminiApiKey (empty if not set)
```

### Verify pi-customization Package

```bash
# The package is a local path reference, not a copy
cat ~/.pi/agent/settings.json | python3 -m json.tool | grep pi-customization

# Should show: "./repos/cfx-tools/infra/pi-customization"
# (local paths are referenced, not copied)
```

### Test PI Interactive Session

```bash
# 1. Start PI
pi

# 2. Check repo status
/repo-status

# 3. List available actions
/repo-actions

# 4. Run a single-shot prompt
pi -p "What are the available repo actions?"

# 5. Exit PI
:q
```

### Test PI with Print Mode

```bash
# Single-shot prompt (no interactive session)
pi -p "Which validation commands should I run for a docs-only change?"

# With model override
pi -p --model Qwen3.6-35B-A3B-MTP-GGUF-Q8_0 "Explain the changes in this commit"
```

### Test the Commit Workflow

```bash
# 1. Make a change
echo "test" >> README.md

# 2. Run commit workflow
pi /repo-commit

# 3. Review the gate UI, approve if satisfied

# 4. Reset
git checkout -- README.md
```

### Test Repo Check Pipeline

```bash
# Run with dry-run first
pi /repo-check --dry-run

# Then run for real (creates OpenSpec changes)
pi /repo-check

# Review the created changes
openspec list
```

### Verify Build and Typecheck Pass

```bash
# All three packages should build cleanly
pnpm --filter @cfxdevkit/llm-agents build
pnpm --filter @cfxdevkit/tooling-cli build
pnpm --filter @cfxdevkit/pi-customization build

# All three should typecheck cleanly
pnpm --filter @cfxdevkit/llm-agents typecheck
pnpm --filter @cfxdevkit/tooling-cli typecheck
pnpm --filter @cfxdevkit/pi-customization typecheck

# All tests should pass
pnpm --filter @cfxdevkit/llm-agents test
pnpm --filter @cfxdevkit/tooling-cli test
```

## Configuring PI

### Provider Configuration

Edit `~/.pi/agent/providers.json` directly:

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
    "commit": "Qwen3.6-35B-A3B-MTP-GGUF-Q8_0"
  }
}
```

### Action Policy Overrides

Specify per-action model overrides:

```json
{
  "actionPolicies": {
    "review": {
      "profile": "local-fast",
      "model": "Qwen3.6-35B-A3B-MTP-GGUF-Q8_0"
    }
  }
}
```

### DCP Configuration

Edit `~/.pi/agent/dcp.json` for Dynamic Context Pruning:

```json
{
  "compress": {
    "minContextLimit": 30000,
    "maxContextLimit": 70000,
    "nudgeForce": "strong"
  },
  "strategies": {
    "deduplication": { "enabled": true },
    "purgeErrors": { "enabled": true, "turns": 2 }
  }
}
```

### Web Search API Keys

Edit `~/.pi/web-search.json`:

```json
{
  "exaApiKey": "your-exa-key",
  "perplexityApiKey": "your-perplexity-key",
  "geminiApiKey": "your-gemini-key"
}
```

## Migrating from Old Structure

If you have an existing `.pi/` directory from before the consolidation, the
new `post-create.sh` will handle migration:

```bash
# 1. Install PI globally (if not already)
npm i -g @earendil-works/pi-coding-agent@0.79.10

# 2. Run post-create to create ~/.pi/agent/ and migrate config
.devcontainer/scripts/post-create.sh
```

The migration does the following:
1. Creates `~/.pi/agent/providers.json` from `.pi/providers.json` + `.pi/agent/models.json`
2. Copies skills from `.pi/skills/` to `~/.pi/agent/skills/`
3. Copies prompts from `.pi/prompts/` to `~/.pi/agent/prompts/`
4. Creates `~/.pi/agent/dcp.json` if it doesn't exist
5. Copies web search keys to `~/.pi/web-search.json`
6. Installs `pi-customization`, `pi-dcp`, and `pi-web-access` as PI packages

## Troubleshooting

### `command -v pi` fails

```bash
# Install PI globally
npm i -g @earendil-works/pi-coding-agent@0.79.10

# Verify
command -v pi && pi --version
```

### PI doesn't find the repo extension

```bash
# Check that the package is registered
pi list

# Re-run post-create to install the package
.devcontainer/scripts/post-create.sh

# Reload PI session
# (In PI: /reload)
```

### Provider config is stale

```bash
# Check current config
cat ~/.pi/agent/providers.json | python3 -m json.tool | head -10

# Re-run post-create to refresh
.devcontainer/scripts/post-create.sh
```

### Headroom proxy not reachable

```bash
# Check proxy is running
curl -s http://localhost:28787/v1/models | head -5

# If not running, the post-start script should auto-start it
# Otherwise, start manually:
.devcontainer/scripts/start-headroom.sh
```

### No models available

```bash
# Verify provider connectivity
pi /repo-status

# Check providers.json
cat ~/.pi/agent/providers.json | python3 -m json.tool

# If baseUrl is wrong, update providers.json directly
```

### Web search not working

```bash
# Check API keys
cat ~/.pi/web-search.json | python3 -m json.tool

# If keys are empty, set environment variables:
export EXA_API_KEY="your-key"
export PERPLEXITY_API_KEY="your-key"
export GEMINI_API_KEY="your-key"
```

## Comparison: Old vs New

| Aspect | Old | New |
|--------|-----|-----|
| **PI installation** | Transitive dependency (`tooling-cli → pi-agent → pi-coding-agent`) | Global npm install (`npm i -g pi-coding-agent`) |
| **PI binary** | Not on PATH | On PATH (`pi` available immediately) |
| **Customization** | TypeScript wrapper (`@cfxdevkit/pi-agent`) | PI package (`@cfxdevkit/pi-customization`) |
| **Config location** | `.pi/` (in repo, has secrets) | `~/.pi/agent/` (user-local, never in repo) |
| **cdk agent command** | `cdk agent` entrypoint | Removed — use `pi` directly |
| **Scope resolution** | `CFXDEVKIT_PI_SCOPE` env var | Not needed — PI manages config |
| **Skills** | `.pi/skills/` (in repo) | `~/.pi/agent/skills/` (copied from repo) |
| **Providers** | `.pi/providers.json` + `.pi/agent/models.json` | `~/.pi/agent/providers.json` (merged) |
