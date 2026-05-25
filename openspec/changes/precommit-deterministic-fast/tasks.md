## P1 — Remove LLM from precommit workflow

- [x] **P1.1** In `precommit.ts`: remove `import { analyzeGateFailures }` and `import { resolveExecutionContext }`
- [x] **P1.2** Replace `resolveExecutionContext({ useLlm: true, action: 'validation' })` with a
  plain `resolveExecutionContext({ useLlm: false })` (or remove the call entirely if only
  used for LLM context)
- [x] **P1.3** Remove both `analyzeGateFailures(...)` call sites
- [x] **P1.4** Remove `failureAnalysis` from the returned `PrecommitWorkflowResult` objects
- [x] **P1.5** In `types.ts`: remove `failureAnalysis` field from `PrecommitWorkflowResult`
- [x] **P1.6** Remove `llmFailureAnalysis` flag from `createWorkflowTerminalUi` call in `precommit.ts`

## P2 — Compact failure formatter

- [x] **P2.1** In `terminal-ui.ts`: add `formatCompactGateFailures(report: GateReport): string[]`
  — for each failing gate: `✗ <label> (<elapsedMs>ms)` + up to 3 trimmed `signalLines`
- [x] **P2.2** Replace `summarizeGateFailures` calls in precommit with `formatCompactGateFailures`
- [x] **P2.3** Remove `summarizeFailureAnalysis` calls (LLM prose) from precommit terminal output
- [x] **P2.4** Ensure `ui.finish('blocked', lines)` receives only the compact gate lines +
  `'precommit blocked: N gate(s) failing'`
- [x] **P2.5** Remove `llmFailureAnalysis` flag from `createWorkflowTerminalUi` options interface
  (or mark as unused/deprecated)

## P3 — Update agent guidance

- [x] **P3.1** In `AGENTS.md`: update the "Commit & Implementation Gate" section to add:
  `"If precommit fails, call repo_agent_check to get LLM-assisted remediation and OpenSpec changes"`
- [x] **P3.2** In `.pi/skills/openspec-apply-change/SKILL.md` step 7: add note that
  `repo_agent_check` is the follow-up if precommit fails structurally

## Validate

- [x] **V.1** `cdk repo precommit` runs to completion with LEMONADE offline (no LLM timeout)
- [x] **V.2** When lint fails: output contains `✗ Lint` + signal lines, ≤ 20 total lines
- [x] **V.3** When all pass: output contains `status: passed`, process exits 0
- [x] **V.4** `pnpm run typecheck` passes for `llm-agents`
- [x] **V.5** `pnpm run test` passes for `llm-agents`
