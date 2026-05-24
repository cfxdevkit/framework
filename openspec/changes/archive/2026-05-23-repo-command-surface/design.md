## Context

### Current execution paths

```
cdk repo check docs/ci/secrets/corpus/eval
cdk repo generate api/readme/structure/unit-configs
cdk repo arch-check
    └──→ runRootScript(script, args)
             └──→ spawn('pnpm', ['run', script, ...args])
                      → inherited stdio, exit code only, no JSON

cdk repo precommit / commit
    └──→ llm-agents/commit/gates.ts  QUALITY_GATES[]
             └──→ execFileAsync('pnpm', gate.args)
                      → captured stdout/stderr, own GateResult type, no JSON contract

cdk repo check validation / hotspots / kebab-groups / unit-configs
    └──→ cdk-repo-check  runRepoCheck(target, args)
             └──→ RepoStructuredResult  ✓  typed, persisted to artifacts/llm/repo-check/
```

### What `cdk-repo-check` already provides

Every result shares `RepoStructuredBase`:

```ts
{
  kind: 'repo-structured',
  command: { namespace, action, target, script, args, outputMode },
  context: { workspaceRoot, requestedFrom, metadataRoot, generatedAt, gitNexus },
  artifacts: { reportPath, workspaceNodePath },
  status: 'ok' | 'warning' | 'error',
  exitCode: number,
}
```

`runRepoCommand` already covers: `gitnexus-analyze`, `build`, `test`, `lint`, `typecheck`,
`format`, `format-check`, `check-unused`, `security-audit`, `security-check`,
`check-docs`, `check-ci`, `check-secrets`, `check-corpus`, `check-eval`,
`generate-api`, `generate-readme`, `generate-structure`, `generate-unit-configs`, `arch-check`.

`runRepoCheck` covers: `validation`, `hotspots`, `kebab-groups`, `unit-configs`.

The only gap: `build` is not in `validationStepDefinitions` and `RepoValidationStepId` does not include `'build'`.

### What consumers need

| Consumer | Today | Target |
|----------|-------|--------|
| `cdk repo check *` | raw spawn → terminal only | `runRepoCheck` / `runRepoCommand` → text + optional `--json` |
| `cdk repo generate *` | raw spawn → terminal only | `runRepoCommand` → text + optional `--json` |
| `cdk repo arch-check` | raw spawn → terminal only | `runRepoCommand('arch-check')` → text + optional `--json` |
| `cdk repo run <target>` | *(does not exist)* | `runRepoCommand(target)` → text + optional `--json` |
| `gates.ts` quality gates | raw pnpm, own types | `runRepoCommand` → `RepoCommandResult` mapped to `GateResult` |
| `gates.ts` policy gates | raw pnpm, own types | `runRepoCheck` → mapped to `GateResult` |
| `cdk agent chat` | not accessible | `runRepoCommand` / `runRepoCheck` via tool call → JSON |
| VSCode extension | *(future)* | import `@cfxdevkit/cdk-repo-check` → programmatic API |

## Goals / Non-Goals

**Goals:**
- Every `cdk repo` sub-command that invokes a step produces a `RepoStructuredResult` — no bypasses.
- `gates.ts` consumes `runRepoCommand` / `runRepoCheck` — execution logic lives in one package.
- `cdk repo run <target>` surfaces the full `RepoCommandTarget` set for direct invocation.
- `build` is in the canonical validation sequence in `cdk-repo-check`.
- A `RepoResultRenderer` contract lets CLI, agent, and future VSCode pick their output format from the same structured data.

**Non-Goals:**
- Changing the `GateResult` / `GateReport` types or the commit HUD — those stay; only the data source changes.
- LLM enrichment of individual command results — that belongs in `llm-agents` on top of the JSON; not in `cdk-repo-check`.
- Moving `QUALITY_GATES` flag logic (`withTests`, `withBuild`, timeouts) into `cdk-repo-check` — flags stay in `llm-agents`; only the execution call site moves.
- MCP server tooling for repo commands — separate change; this establishes the programmatic API it would call.

## Decisions

### D1 — `cdk-repo-check` is the single execution contract; no other call site runs pnpm directly for steps

All step execution goes through `runRepoCheck` or `runRepoCommand`. The `tooling-cli` and `llm-agents` are consumers of that contract, not re-implementors. This makes the artifact paths, JSON schema, and GitNexus context consistent across every caller.

### D2 — `RepoResultRenderer` lives in `cdk-repo-check`

```ts
// @cfxdevkit/cdk-repo-check — new export
export interface RepoResultRenderer {
  renderText(result: RepoStructuredResult): string;    // human-readable for CLI stdout
  renderJson(result: RepoStructuredResult): string;    // JSON.stringify for --json flag
  renderCompact(result: RepoStructuredResult): string; // one-liner for agent context injection
}

export const defaultRenderer: RepoResultRenderer;
```

`renderText` replaces the inline `console.log` + `process.exitCode` pattern in `repo-namespace.ts`.
`renderCompact` is what `llm-agents` context builders use to inject step summaries into prompts.
`renderJson` is what `--json` flags and programmatic callers consume.

### D3 — `gates.ts` maps `RepoCommandResult` → `GateResult`; no changes to `GateResult` shape

```ts
// llm-agents/commit/gates.ts  (schematic)
async function runQualityGate(gate: QualityGateSpec, hooks): Promise<GateResult> {
  const result = await runRepoCommand(gate.target, gate.extraArgs ?? []);
  return {
    kind: 'quality',
    id: gate.id,
    label: gate.label,
    command: `pnpm run ${result.command.script}`,
    required: gate.required,
    status: result.status === 'ok' ? 'ok' : 'error',
    elapsedMs: result.summary.durationMs,
    output: [...result.result.stdoutTail, ...result.result.stderrTail].join('\n'),
    summary: renderCompact(result),
    signalLines: result.result.stdoutTail.slice(0, 3),
    hints: [],
  };
}
```

`QUALITY_GATES` shrinks to flag/timeout metadata only — the implementation is gone:

```ts
// llm-agents/workers/shared/index.ts  (after)
export const QUALITY_GATE_SPECS = [
  { id: 'gitnexus-analyze', target: 'gitnexus-analyze', required: true,  timeoutMs: 300000 },
  { id: 'format',           target: 'format',           required: true,  timeoutMs: 180000 },
  { id: 'lint',             target: 'lint',             required: true,  timeoutMs: 120000 },
  { id: 'typecheck',        target: 'typecheck',        required: true,  timeoutMs: 180000 },
  { id: 'test',             target: 'test',             required: true,  timeoutMs: 600000 },
  { id: 'build',            target: 'build',            required: true,  timeoutMs: 300000 },
] as const;
// hotspots, kebab-groups, check → runRepoCheck('hotspots'|'kebab-groups'|'validation')
```

### D4 — `cdk repo run <target>` is the escape hatch for direct command invocation

```
cdk repo run lint
cdk repo run build
cdk repo run security-audit
cdk repo run generate-api
cdk repo run arch-check --json
```

Target must be a valid `RepoCommandTarget`. Output: `renderText` by default, `renderJson` with `--json`.
This replaces the need for `cdk repo generate *` and `cdk repo arch-check` as separate sub-commands
(those stay as aliases for discoverability, but route through `runRepoCommand`).

### D5 — `--json` flag is universal across all `cdk repo` commands

Every `cdk repo check *`, `cdk repo generate *`, `cdk repo run *` accepts `--json` and outputs
`JSON.stringify(result, null, 2)`. This is the programmatic interface for `cdk agent chat` tool
calls and for future VSCode extension integration.

### D6 — VSCode extension and `cdk agent chat` consume the same package import

```
VSCode extension:
  import { runRepoCommand, runRepoCheck } from '@cfxdevkit/cdk-repo-check';
  → calls same functions, gets same JSON, renders in extension panel

cdk agent chat (PI tool call):
  → shell: `cdk repo check validation --json`
  → or direct: runRepoCommand('lint', []) called from a PI MCP tool
  → same JSON either way
```

The agent chat path is currently shell-based (PI spawns cdk); direct programmatic import is the
future state when a repo-check MCP tool is added.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| `runRepoCommand` adds JSON serialisation overhead vs raw spawn | Negligible; all steps already write JSON artifacts to disk |
| `gates.ts` refactor touches the commit hot path | Map type is mechanical; GateResult shape unchanged; existing tests cover the output contract |
| `QUALITY_GATES` array removal breaks tests that import it | Rename to `QUALITY_GATE_SPECS`; adjust imports; no behaviour change |
| `cdk repo check docs` previously passed through args to pnpm — structured layer may not forward all args | `runRepoCommand` already accepts `args: readonly string[]` forwarded after `--` |
