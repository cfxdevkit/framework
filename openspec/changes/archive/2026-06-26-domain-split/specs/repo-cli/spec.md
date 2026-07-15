# Capability: repo-cli

## Requirements

### REQ-1: Repository CLI Package

`@cfxdevkit/tooling-cli` MUST provide the `repo` binary with the following commands:

**Validation:**
- `repo check [target] [--fail-on-hard] [--quick]` — run repo validation
  - `target`: `validation` (default), `hotspots`, `kebab-groups`, `unit-configs`
  - Calls `runRepoCheck()` from `@cfxdevkit/cdk-repo-check` directly (NOT via CLI spawning)
  
**Precommit:**
- `repo precommit [--force] [--skip-checks] [--with-tests] [--with-build]` — run precommit workflow
  - Calls `runPrecommitWorkflow()` from `@cfxdevkit/llm-agents` directly

**Status:**
- `repo status` — show provider/model context and available workflows

**Actions:**
- `repo actions [--mode <deterministic|exploratory>]` — list available repo actions
  - Calls `listRepoActions()` from `@cfxdevkit/llm-agents`
- `repo run <action> [--quick] [--model <id>] [prompt]` — run a specific action
  - Calls `executeAction()` from `@cfxdevkit/llm-agents`

**Review:**
- `repo review` — run repository review agent
  - Calls `runReviewAgent()` from `@cfxdevkit/llm-agents`

**Docs:**
- `repo docs generate [all|api|readme|structure|packages]` — generate docs
  - Calls `docsToolingNamespace` from `@cfxdevkit/docs-pipeline`
- `repo docs validate [content|packages|wiki|all] [args]` — validate docs
  - Calls `docsToolingNamespace` from `@cfxdevkit/docs-pipeline`

**Merge:**
- `repo merge [--dry-run] [--base <branch>] [branch...]` — merge validation
  - Calls `runMerge()` from `@cfxdevkit/llm-agents`

### REQ-2: Repository CLI Dependencies

`@cfxdevkit/tooling-cli` MUST depend ONLY on repo-related packages:
- `@cfxdevkit/cdk-repo-check` — repo check orchestration
- `@cfxdevkit/docs-pipeline` — documentation ops
- `@cfxdevkit/workspace-utils` — workspace root resolution
- `clipanion` — CLI framework

`@cfxdevkit/tooling-cli` MUST NOT depend on blockchain packages:
- NO `@cfxdevkit/cdk`
- NO `@cfxdevkit/services`
- NO `@cfxdevkit/signer-session`
- NO `@cfxdevkit/devnode-server`

Peer dependencies:
- `@cfxdevkit/llm-agents` — LLM workflows (peer, not direct import in CLI)

### REQ-3: Repository CLI Binary

`@cfxdevkit/tooling-cli` MUST export the `repo` binary (not `cdk`). The binary MUST:
- Be named `repo` in `package.json` `bin` field
- NOT have a `cdk` alias (removed in Phase 3)
- Support `repo <command>` entry point
- Support `repo <command> --help`

### REQ-4: Repository CLI Namespace Structure

`tooling-cli/src/registry.ts` MUST register `repoToolingNamespace`:

```typescript
export const toolingNamespaces = [
  repoToolingNamespace,  // ← only namespace
] as const;
```

NO other namespaces (chain, keystore, address, units, docs) should be in the `cdk` binary.
Docs namespace moves to `repo` namespace (it's repo-adjacent, not blockchain).

### REQ-5: Repository CLI Internal Calls

ALL repo CLI commands MUST call library functions directly, NOT spawn CLI commands:

**CORRECT:**
```typescript
import { runRepoCheck } from '@cfxdevkit/cdk-repo-check'
const result = await runRepoCheck('validation', [])
```

**INCORRECT (must be removed):**
```typescript
import { execFileAsync } from 'child_process'
const result = await execFileAsync('pnpm', ['cdk', 'repo', 'check'])
```

### REQ-6: Repository CLI Moon Tasks

Moon tasks in `tooling-cli/moon.yml` MUST delegate to the `repo` binary:

```yaml
repo-check:
  script: 'pnpm --filter @cfxdevkit/tooling-cli tooling repo check'

repo-precommit:
  script: 'pnpm --filter @cfxdevkit/tooling-cli tooling repo precommit'

repo-review:
  script: 'pnpm --filter @cfxdevkit/llm-agents exploratory validation'

repo-merge:
  script: 'pnpm --filter @cfxdevkit/llm-agents agent-merge'

# Agent tasks stay (LLM workflows are repo management)
agent-check:
  script: 'pnpm --filter @cfxdevkit/llm-agents agent-check'

agent-deterministic:
  script: 'pnpm --filter @cfxdevkit/llm-agents deterministic'

agent-exploratory:
  script: 'pnpm --filter @cfxdevkit/llm-agents exploratory'
```

## Non-Requirements

- Repo CLI MUST NOT import from `@cfxdevkit/cdk` (blockchain RPC)
- Repo CLI MUST NOT import from `@cfxdevkit/services` (keystore)
- Repo CLI MUST NOT import from `@cfxdevkit/signer-session` (signing)
- Repo CLI MUST NOT import from `@cfxdevkit/devnode-server` (devnode)
