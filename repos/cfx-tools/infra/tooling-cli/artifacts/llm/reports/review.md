# LLM Review Agent Report

Generated: 2026-05-22T10:02:58.203Z

## Changed Files

- artifacts/llm/reports/llm-ask.md
- package.json
- repos/cfx-tools/infra/llm-client/src/index.ts
- repos/cfx-tools/infra/llm-client/src/types.ts
- repos/cfx-tools/infra/llm-client/workers/completion/client.test.ts
- repos/cfx-tools/infra/llm-client/workers/completion/client.ts
- repos/cfx-tools/infra/llm-client/workers/completion/index.ts
- repos/cfx-tools/infra/tooling-cli/package.json
- repos/cfx-tools/infra/tooling-cli/src/index.ts
- repos/cfx-tools/infra/tooling-cli/src/registry.ts
- repos/cfx-tools/packages/arch-check/src/contracts/workspace-scripts.ts
- src/agent-namespace.test.ts
- src/agent-namespace.ts

## Findings


- warning: artifacts/llm/reports/llm-ask.md: Generated or artifact path changed
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
- pnpm run llm:review
