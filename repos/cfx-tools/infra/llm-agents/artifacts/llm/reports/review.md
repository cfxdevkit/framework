# LLM Review Agent Report

Generated: 2026-06-20T12:51:18.285Z

## Execution Context

- Unit: shared repo config
- Config: ../../../../.pi/providers.json
- LLM: not used

## Changed Files

- artifacts/llm/reports/review.json
- artifacts/llm/reports/review.md
- package.json
- pnpm-lock.yaml
- repos/cfx-tools/infra/llm-agents/package.json
- repos/cfx-tools/infra/pi-agent/src/runtime.ts
- repos/cfx-tools/infra/tooling-cli/moon.yml
- repos/cfx-tools/infra/tooling-cli/package.json
- src/bin.ts

## Findings


- warning: artifacts/llm/reports/review.json: Generated or artifact path changed
  Recommendation: Confirm this file should be committed rather than regenerated locally.
- warning: artifacts/llm/reports/review.md: Generated or artifact path changed
  Recommendation: Confirm this file should be committed rather than regenerated locally.

## Code Hotspots

Status: error; 0 hard violation(s), 0 soft warning(s).
Report: artifacts/llm/reports/code-hotspots.md

## Suggested Validation

- pnpm run lint
- pnpm run typecheck
- pnpm exec moon run :test --concurrency 4
- pnpm run check:docs
- pnpm exec changeset status
- pnpm run llm:changeset
- pnpm run llm:release
- pnpm run repo:review
