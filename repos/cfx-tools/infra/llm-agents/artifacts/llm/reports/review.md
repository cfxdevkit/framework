# LLM Review Agent Report

Generated: 2026-06-29T07:27:28.571Z

## Execution Context

- Unit: shared repo config
- Config: ../../../../../../tmp/cfxdevkit-pi-commit-w9pgAh/llm.commit.json
- LLM: not used

## Changed Files

- AGENTS.md
- CLAUDE.md
- repos/cfx-tools/infra/llm-agents/workers/commit/commit.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/failure-analysis.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/gate/results.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/gates.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/hud.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/precommit.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/terminal-ui-summary.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/terminal/ui.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/types.ts
- repos/cfx-tools/infra/llm-agents/workers/commit/workflow.test.ts
- repos/cfx-tools/infra/pi-customization/src/memory.ts
- repos/cfx-tools/packages/arch-check/src/contracts/workspace-scripts/repo.ts
- repos/cfx-tools/packages/cdk-repo-check/src/repo-check/validation.ts
- workers/commit/commit.test.ts
- workers/commit/gates/index.ts
- workers/commit/gates/policy-gates.ts
- workers/commit/gates/quality-gates.ts
- workers/commit/gates/types.ts
- workers/commit/gates/validation.ts
- workers/commit/precommit.test.ts

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
