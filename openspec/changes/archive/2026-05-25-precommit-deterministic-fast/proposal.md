## Why

`cdk repo precommit` is the canonical commit gate but it calls the LLM every time it runs
to analyse failures. This adds 15–30 s of latency on every run, requires a live LLM endpoint,
and produces output that mixes deterministic gate results with probabilistic prose — making
the output harder to parse both by humans and by the agent.

The LLM analysis is genuinely useful, but it belongs in `repo_agent_check` (the remediation
planner), not in the quality gate itself. Precommit should be a pure deterministic fast loop:
run gates, report pass/fail compactly, exit with code.

## What Changes

- Remove `resolveExecutionContext` / `analyzeGateFailures` calls from `runPrecommitWorkflow`
- Remove the `llmFailureAnalysis` flag from the terminal UI
- Output a compact, machine-readable failure summary when gates fail:
  ```
  ✗ Test — 3 files failed (22.1s)
    └─ devnode:test | index.contracts-persistence.test.ts: funds Core Space … FAIL
  ✗ Lint — 1 error (1.3s)
    └─ devnode-server:lint | src/app.ts:1 organizeImports
  precommit blocked: 2 gates failing
  ```
- Exit code 1 on failure, 0 on pass — always, without LLM gating the exit
- The `--model` flag and `useLlm` path are removed from precommit entirely
- `repo_agent_check` remains the single entry point for LLM-assisted remediation planning

## Capabilities

### Modified Capabilities
- `precommit-workflow`: purely deterministic; no LLM dependency; compact failure output

## Impact

- `llm-agents/workers/commit/precommit.ts` — remove `analyzeGateFailures`, `resolveExecutionContext` with `useLlm`
- `llm-agents/workers/commit/terminal-ui.ts` — remove `llmFailureAnalysis` flag, add compact failure formatter
- `llm-agents/workers/commit/types.ts` — remove `failureAnalysis` from `PrecommitWorkflowResult`
- `AGENTS.md` + `openspec-apply-change/SKILL.md` — update guidance: "if precommit fails, call `repo_agent_check` for remediation"
