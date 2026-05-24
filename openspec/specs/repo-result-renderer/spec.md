# repo-result-renderer Specification

## Purpose

Define a presentation contract over `RepoStructuredResult` so CLI, agent context builders, and future UI clients all render the same structured data in the format appropriate for their consumer — without each implementing their own output logic.

## Requirements

### Requirement: `cdk-repo-check` SHALL export a `RepoResultRenderer` interface

`@cfxdevkit/cdk-repo-check` SHALL export:

```ts
export interface RepoResultRenderer {
  renderText(result: RepoStructuredResult): string;
  renderJson(result: RepoStructuredResult): string;
  renderCompact(result: RepoStructuredResult): string;
}
export const defaultRenderer: RepoResultRenderer;
```

#### Scenario: CLI uses renderText
- **WHEN** `cdk repo run lint` completes without `--json`
- **THEN** the CLI SHALL call `defaultRenderer.renderText(result)` and write to stdout

#### Scenario: `--json` uses renderJson
- **WHEN** `cdk repo check validation --json` completes
- **THEN** the CLI SHALL call `defaultRenderer.renderJson(result)` and write to stdout; output SHALL be valid JSON

---

### Requirement: `renderText` SHALL produce human-readable terminal output

`renderText(result)` SHALL return a string with:
- Status indicator (ok / warning / error) and exit code
- Step label and duration
- Key signal lines from stdout/stderr (capped at 8 lines)
- Hard violations or group summaries for check results

#### Scenario: Passing command renders concisely
- **WHEN** `renderText` is called on an `ok` `RepoCommandResult`
- **THEN** the output SHALL include the command label, duration, and a short summary line — no raw output dump

#### Scenario: Failing command renders signal lines
- **WHEN** `renderText` is called on an `error` `RepoCommandResult`
- **THEN** the output SHALL include the error status and the last 8 signal lines from stderr

---

### Requirement: `renderCompact` SHALL produce a one-liner for agent context injection

`renderCompact(result)` SHALL return a single line: `<target> <status> (<durationMs>ms): <summary>`.

#### Scenario: Compact line fits in prompt context
- **WHEN** `renderCompact` is called on a `RepoCommandResult` for `lint`
- **THEN** the output SHALL be a single line, e.g. `lint ok (4321ms): 0 errors`

#### Scenario: Compact line for check result includes key count
- **WHEN** `renderCompact` is called on a `RepoCheckHotspotsResult`
- **THEN** the output SHALL include hard violation count and soft warning count

---

### Requirement: `renderJson` SHALL be `JSON.stringify(result, null, 2)`

`renderJson(result)` SHALL return the full `RepoStructuredResult` as pretty-printed JSON.

#### Scenario: JSON output is machine-parseable
- **WHEN** `renderJson` is called
- **THEN** `JSON.parse(renderJson(result))` SHALL equal `result` without data loss

---

### Requirement: LLM enrichment of results is the responsibility of `llm-agents`, not `cdk-repo-check`

`cdk-repo-check` SHALL NOT import or reference any LLM provider. Enrichment (e.g. remediation advice, failure summaries) belongs in `llm-agents` and is applied on top of `RepoStructuredResult`.

#### Scenario: cdk-repo-check has no LLM dependency
- **WHEN** `@cfxdevkit/cdk-repo-check` is imported
- **THEN** no LLM provider, completion, or config module SHALL be transitively required
