# `@cfxdevkit/llm-agents` — Structure

Typed LLM workflow agents for Conflux DevKit repository automation.

Workspace path: `repos/cfx-tools/infra/llm-agents`

## Directory Tree

```text
.gitignore
API.md
README.md
STRUCTURE.md
biome.json
lint_output.txt
moon.yml
openspec
  changes
    archive
      2026-05-20-ui-subpath-exports — archived spec change
    cfx-llm-merge — spec change for LLM merge workflow
    keystore-server-split — spec change for keystore server split
    solidity-tools-move — spec change for Solidity tools move
package.json
repos
  cfx-tools
    packages
      keystore-server — external package reference (monorepo sibling)
src
  index.ts — public entry point (re-exports workers)
tsconfig.json
vite.config.ts
workers
  agents
    all.ts — aggregate agent runner
    check-artifacts.ts — artifact validation agent
    check-plan.ts — plan validation agent
    check-render.ts — render validation agent
    check-types.ts — type-checking agent
    check.test.ts — unit tests for check agents
    check.ts — core check agent
    review.ts — code review agent
    runtime
      checks.ts — runtime check utilities
      constants.ts — shared constants
      corpus.ts — documentation corpus loader
      docs.ts — doc generation helpers
      index.ts — runtime module entry
      models.ts — LLM model definitions
      paths.ts — path resolution helpers
      reports.ts — report generation utilities
    smoke-render.ts — smoke test for rendering
    smoke.ts — smoke test runner
  commands.ts — CLI command definitions
  commit
    changeset.ts — changeset generation logic
    commit.ts — commit message generation
    failure-analysis.ts — failure diagnosis helper
    flags.ts — CLI flag parsing
    gate-output.ts — gate result output formatting
    gate-results.ts — gate result aggregation
    gates.test.ts — gate tests
    gates.ts — gate execution engine
    hud.ts — terminal HUD rendering
    index.test.ts — integration tests
    index.ts — commit workflow entry
    message.ts — commit message formatting
    precommit.ts — precommit checks
    scope.ts — commit scope resolution
    terminal-ui-summary.ts — terminal summary UI
    terminal-ui.test.ts — terminal UI tests
    terminal-ui.ts — terminal UI helpers
    types.ts — commit workflow types
    validate.ts — commit validation
    workflow.test.ts — workflow tests
  completion
    complete.ts — CLI completion helper
    config-normalize.ts — config normalization
    config.ts — completion config
    context.ts — context provider
    guards.ts — type guards for completion
    index.ts — completion entry
    json.ts — JSON completion helpers
    provider-classes.ts — provider class registry
    provider-meta.ts — provider metadata
    provider-stream-parse.ts — stream parsing
    provider-stream.ts — streaming helpers
    providers.ts — provider registry
    runner.ts — completion runner
    types.ts — completion types
    units.ts — completion units
  docs
    api-enrichment.test.ts — API enrichment tests
    api-enrichment.ts — API doc enrichment
    api-probe.test.ts — API probe tests
    api-probe.ts — API discovery probe
    api.ts — API doc generation
    flags.ts — docs CLI flags
    index.ts — docs workflow entry
    package-page-enrichment.test.ts — package page tests
    package-page-enrichment.ts — package page enrichment
    packages.ts — package metadata loader
    readme-enrichment.ts — README enrichment
    readme.ts — README generation
    structure-enrichment.ts — structure enrichment
    structure.ts — structure doc generation
    wiki.ts — wiki doc generation
  help.ts — CLI help system
  llm-agents.ts — main entry (re-exports workers)
  shared
    execution-context.ts — execution context utils
    index.ts — shared module entry
    logging.ts — logging helpers
    repo-actions.ts — repo operation helpers
  tests
    baseline.ts — test baseline generation
    discover.ts — test discovery
    generate.ts — test generation
    index.ts — tests workflow entry
    support.ts — test support utilities
    write.ts — test file writing
  validate-models-probe.ts — model validation probe
  validate-models-report.ts — model validation report
  validate-models.ts — model validation runner
```

<!-- structure-status: enriched -->
<!-- structure-hash: d24dd74d05ea0dc3a17147fc144774b95548f06c6530cf546b9a7ede3f4034f2 -->
