## Context

`runPrecommitWorkflow` today calls `resolveExecutionContext({ useLlm: true })` to set up an
LLM session, then after any gate failure calls `analyzeGateFailures(...)`. This path
takes 15–30 s and requires Lemonade or a cloud model to be reachable.

The LLM analysis summarizes the gate output in prose and suggests next commands. That value
is real — but it is exactly what `repo_agent_check` does (and does better, since it also
creates OpenSpec changes). Having it in precommit creates duplicate paths and slows the
tight feedback loop that precommit is supposed to provide.

## Goals / Non-Goals

**Goals:**
- `cdk repo precommit` exits within the gate run time (no LLM wait)
- On failure: prints a compact, structured summary — gate name, elapsed, first signal lines
- On pass: single-line confirmation  
- Exit code is always set deterministically (0 pass, 1 fail)
- Output is stable enough to be parsed by the agent without LLM interpretation

**Non-Goals:**
- Removing LLM from `runCommitWorkflow` (the commit flow still benefits from it)
- Changing the gate definitions or order
- Removing `repo_agent_check` — it remains the remediation path

## Decisions

**Compact failure format.** Each failing gate emits: status icon + gate name + elapsed +
first 3 signal lines. Total output for a typical 2-gate failure: 8–12 lines. The agent
can read this directly without needing an LLM interpretation layer.

**`failureAnalysis` removed from `PrecommitWorkflowResult`.** Downstream callers that
currently read `result.failureAnalysis` should call `repo_agent_check` instead if they need
LLM-backed analysis.

**`--model` flag stripped from precommit.** It was only used for the LLM analysis path.
The flag is silently ignored if passed (backward compat) but has no effect.

## Risks / Trade-offs

- Callers that relied on `result.failureAnalysis` in the precommit result type will need
  to be updated. Audit: only `runPrecommit` (the public entry point) uses it, and it
  already just formats the result for console output.
