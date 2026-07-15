# LLM Review Agent Report

Generated: 2026-06-29T19:58:28.440Z

## Execution Context

- Unit: shared repo config
- Config: ../../../../../../tmp/cfxdevkit-pi-commit-PCXEXx/llm.commit.json
- LLM: not used

## Changed Files

- .pi/agent/memory/core.jsonl
- .pi/agent/memory/corrections.jsonl
- .pi/agent/memory/index.json
- .pi/agent/memory/patterns.jsonl
- .pi/prompts/opsx-apply.md
- .pi/prompts/opsx-archive.md
- .pi/prompts/opsx-explore.md
- .pi/prompts/opsx-propose.md
- AGENTS.md
- CLAUDE.md
- repos/cfx-tools/infra/llm-agents/src/index.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/commit.test.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/commit.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/gates.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/gates/validation.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/message.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/precommit.test.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/terminal/ui.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/types.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/workflow.test.ts
- repos/cfx-tools/infra/pi-customization/src/commands/repo-actions.ts
- repos/cfx-tools/infra/pi-customization/src/index.ts
- repos/cfx-tools/infra/pi-customization/src/llm-agents-runtime.ts
- repos/cfx-tools/infra/pi-customization/src/memory.ts
- repos/cfx-tools/infra/pi-customization/src/tools.ts
- repos/cfx-tools/infra/pi-customization/src/tools/commit.ts
- workers/commit/post-checks.ts
- workers/commit/terminal/progress.ts

## Findings


- warning: repos/cfx-tools/infra/llm-agents/workers/commit/workflow.test.ts: Security-sensitive surface changed
  Recommendation: Run pnpm run security:check plus targeted tests before review.

## Code Hotspots

Status: error; 0 hard violation(s), 0 soft warning(s).
Report: artifacts/llm/reports/code-hotspots.md

## Suggested Validation

- pnpm run lint
- pnpm run typecheck
- moon exec --force --quiet --no-actions --upstream none --downstream none :test
- pnpm run check:docs
- pnpm run security:check
- pnpm run repo:review
