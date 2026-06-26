# Capability: domain-separation

## Requirements

### REQ-1: Clear Package Responsibilities

Each package MUST have a single, obvious responsibility:

| Package | Responsibility | CLI Binary |
|---------|---------------|------------|
| `@cfxdevkit/cli` | Blockchain CLI | `cfx` |
| `@cfxdevkit/tooling-cli` | Repository CLI | `repo` |
| `@cfxdevkit/cdk-repo-check` | Pure library — repo check orchestration | (none) |
| `@cfxdevkit/arch-check` | Pure library — repo health checks | (none) |
| `@cfxdevkit/docs-pipeline` | Pure library — documentation ops | (none) |
| `@cfxdevkit/llm-agents` | LLM workflows | (none, peer dep for tooling-cli) |
| `@cfxdevkit/pi-customization` | PI (AI assistant) integration | (none, PI tool) |
| `@cfxdevkit/cdk` | Blockchain RPC client library | (none) |

### REQ-2: No Mixed-Domain Imports

A package MUST NOT import from both domains:

**`@cfxdevkit/tooling-cli` MUST NOT import:**
- `@cfxdevkit/cdk` (blockchain RPC)
- `@cfxdevkit/services` (keystore backends)
- `@cfxdevkit/signer-session` (signer operations)
- `@cfxdevkit/devnode-server` (devnode control plane)

**`@cfxdevkit/cli` MUST NOT import:**
- `@cfxdevkit/cdk-repo-check` (repo checks)
- `@cfxdevkit/llm-agents` (LLM workflows)

### REQ-3: No Hardcoded CLI Commands in Business Logic

Library packages MUST NOT spawn CLI commands to call other packages:

**`@cfxdevkit/llm-agents` MUST NOT use:**
```typescript
import { execFileAsync } from 'child_process'
const result = await execFileAsync('pnpm', ['cdk', 'repo', 'check'])
```

**`@cfxdevkit/llm-agents` MUST use:**
```typescript
import { runRepoCheck } from '@cfxdevkit/cdk-repo-check'
const result = await runRepoCheck('validation', [])
```

### REQ-4: Consistent Entry Points

Each domain MUST have exactly ONE terminal entry point:

| Domain | Terminal Entry | Moon Entrypoint |
|--------|---------------|-----------------|
| Blockchain | `cfx <command>` | `moon run devnode:*, signer:*` |
| Repo | `repo <command>` | `moon run repo:*, agent:*, docs:*` |

### REQ-5: PI Delegation Layer

`@cfxdevkit/pi-customization` MUST delegate to libraries, not duplicate logic:

**PI `/repo-*` commands:**
- `/repo-check` → delegates to `repo check` command (or `runRepoCheck()` L1 + LLM planning)
- `/repo-commit` → delegates to `repo precommit` command (or `runCommitWorkflow()` L2)
- `/repo-status` → delegates to `repo status` command
- `/repo-actions` → delegates to `repo actions` command
- `/repo-run` → delegates to `repo run <action>` command

**PI `/cdk` commands:**
- `/cdk status` → delegates to `cfx status` command
- `/cdk derive` → delegates to `cfx derive` command
- `/cdk generate` → delegates to `cfx generate` command
- `/cdk contracts` → delegates to `cfx contracts extract` command

PI MUST NOT call library functions directly when a CLI command exists. It delegates to CLI commands, which call libraries.

### REQ-6: No `cdk repo` Namespace

The `cdk` binary MUST NOT have a `repo` namespace. The `repo` binary is separate.

**INCORRECT:**
```
cdk repo check        ← doesn't work, namespace never added
cdk repo precommit    ← doesn't exist
```

**CORRECT:**
```
repo check            ← works (repo binary)
repo precommit        ← works (repo binary)
```

### REQ-7: Export Consistency

`@cfxdevkit/llm-agents` MUST export ALL public functions from `src/index.ts`:

**Currently exports (broken):**
```typescript
export { runAgentCheck } from './workers/agents/check.js'
export { runAgentSmoke } from './workers/agents/smoke.js'
```

**Must export (complete):**
```typescript
// Agent check
export { runAgentCheck } from './workers/agents/check.js'
export { runAgentSmoke } from './workers/agents/smoke.js'

// Commit workflow
export { runPrecommitWorkflow } from './workers/commit/precommit.js'
export { runCommitWorkflow } from './workers/commit/commit.js'
export { runPrecommit } from './workers/commit/precommit.js'
export { runCommit } from './workers/commit/commit.js'
export { parseCommitFlags } from './workers/commit/flags.js'
export { setTuiConfirm } from './workers/commit/commit.js'

// Repo actions
export { listRepoActions, executeAction, getRepoAction, repoActions } from './workers/shared/repo-actions.js'

// Review
export { runReviewAgent } from './workers/agents/review.js'

// Docs
export { runDocsApi, runDocsApiProbe, runDocsPackagePages, runDocsReadme, runStructureUpkeep } from './workers/docs/index.js'
export { runWikiGenerate } from './workers/docs/wiki.js'

// Tests
export { runTestUpkeep } from './workers/tests/index.js'

// All
export { runAll } from './workers/agents/all.js'

// Commands
export { configure, listModels, validateModels, resolveActionConfig } from './workers/commands.js'
```

### REQ-8: Stale Command Removal

`@cfxdevkit/llm-agents` MUST remove the `repoCheckCommand` constant:

```typescript
// DELETE THIS:
export const repoCheckCommand = ['cdk', 'repo', 'check'] as const;

// USE direct library calls instead:
import { runRepoCheck } from '@cfxdevkit/cdk-repo-check'
```

## Non-Requirements

- Domain separation does NOT require renaming `@cfxdevkit/cdk-repo-check` (keep name)
- Domain separation does NOT require removing moon tasks (they're orchestrators)
- Domain separation does NOT require changing `@cfxdevkit/pi-customization` delegation pattern (it's correct, just needs updates)
- Domain separation does NOT require changing `@cfxdevkit/cdk` RPC client (it's the blockchain library)
