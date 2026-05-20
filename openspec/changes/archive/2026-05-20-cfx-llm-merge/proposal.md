## Why

`repos/cfx-llm/` is a separate mono-sub-repo containing three internal automation packages (`llm-client`, `llm-agents`, `llm-tools`). No external consumer depends on them — they are developer tooling used exclusively inside this monorepo. Maintaining them in an isolated repo creates:

- Extra entry in `pnpm-workspace.yaml` / `.moon/workspace.yml` / `arch-rules.yaml` just for internal tools
- Conceptual friction: ADR-0003 reserved cfx-llm as a carve-out candidate but the pre-condition (generic core separated from cfxdevkit config layer) is not yet met
- The packages already sit at `Tier 1` in the arch model, which is exactly where `cfx-tools/infra/` lives

Moving them into `repos/cfx-tools/infra/` collapses cfx-llm into cfx-tools, removes one repo from the workspace topology, and makes the infra boundary explicit.

## What Changes

- `repos/cfx-tools/infra/` directory created (new sub-directory, not a new workspace glob — pnpm-workspace already matches `repos/*/packages/*` but we use `infra/` to signal future-extraction intent; requires an explicit glob addition)
- Packages moved:
  - `repos/cfx-llm/packages/llm-client/` → `repos/cfx-tools/infra/llm-client/`
  - `repos/cfx-llm/packages/llm-agents/` → `repos/cfx-tools/infra/llm-agents/`
  - `repos/cfx-llm/packages/llm-tools/` → `repos/cfx-tools/infra/llm-tools/`
- `pnpm-workspace.yaml` — add `"repos/cfx-tools/infra/*"` glob
- `.moon/workspace.yml` — update three project paths from `repos/cfx-llm/packages/*` to `repos/cfx-tools/infra/*`
- `repos/cfx-meta/packages/arch-rules/arch-rules.yaml` — remove cfx-llm repo entry, add infra sub-path to cfx-tools allowlist
- `repos/cfx-llm/` repo skeleton (`package.json`, README, moon.yml) removed
- All `@cfxdevkit/llm-*` npm package names, versions, and inter-package `workspace:*` deps unchanged

## Capabilities

### New Capabilities
- `llm-tools-in-cfx-tools`: LLM automation packages live under `repos/cfx-tools/infra/`, co-located with the rest of the developer platform and clearly separated from published runtime packages.

### Modified Capabilities

## Impact

- `repos/cfx-llm/` — deleted (after packages moved)
- `repos/cfx-tools/infra/` — created (llm-client, llm-agents, llm-tools)
- `pnpm-workspace.yaml` — add `infra/*` glob
- `.moon/workspace.yml` — update 3 project paths
- `repos/cfx-meta/packages/arch-rules/arch-rules.yaml` — remove cfx-llm, update cfx-tools
- No changes to any consumer imports or package names
