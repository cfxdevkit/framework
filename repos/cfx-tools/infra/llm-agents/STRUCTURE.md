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
      2026-05-20-ui-subpath-exports
    cfx-llm-merge
      .openspec.yaml
    keystore-server-split
      .openspec.yaml
    solidity-tools-move
      .openspec.yaml
package.json
repos
  cfx-tools
    packages
      keystore-server
src
  index.ts — public entry point
tsconfig.json
vite.config.ts
workers
  agents
    all.ts — agent registry
    check
      artifacts.ts — artifact validation logic
      plan.ts — plan generation
      render.ts — render checks
      types.ts — check types
    check.test.ts — unit tests for check logic
    check.ts — main check orchestrator
    review.ts — review agent
    runtime
      checks.ts — runtime check helpers
      constants.ts — shared constants
      corpus.ts — documentation corpus loader
      docs.ts — docs utility helpers
      index.ts — runtime entry
      models.ts — LLM model config
      paths.ts — path resolution helpers
      reports.ts — report generation
    smoke-render.ts — smoke test for rendering
    smoke.ts — smoke test runner
  commands.ts — CLI command definitions
  commit
    changeset.ts — changeset handling
    commit.ts — commit message generation
    failure-analysis.ts — failure diagnostics
    flags.ts — CLI flags
    gate
      output.ts — gate output formatting
      results.ts — gate result types
    gates.test.ts — gate tests
    gates.ts — gate execution logic
    hud.ts — HUD UI helper
    index.test.ts — integration tests
    index.ts — commit workflow entry
    message.ts — commit message formatting
    precommit.ts — precommit checks
    scope.ts — scope resolution
    terminal
      ui.test.ts — terminal UI tests
      ui.ts — terminal UI helpers
    terminal-ui-summary.ts — terminal summary renderer
    types.ts — commit workflow types
    validate.ts — commit validation
    workflow.test.ts — workflow tests
  completion
    cloud-credentials.ts — cloud credential helpers
    complete.ts — completion entry
    config-normalize.ts — config normalization
    config.ts — completion config
    context.ts — completion context
    guards.ts — type guards
    index.ts — completion entry
    json.ts — JSON helpers
    provider
      classes.ts — provider implementations
      meta.ts — provider metadata
      stream.ts — streaming helpers
    provider-stream-parse.ts — stream parser
    providers.ts — provider registry
    resolve-action.ts — action resolution
    runner.ts — completion runner
    types.ts — completion types
    units.ts — completion units
  docs
    api
      enrichment.test.ts — API enrichment tests
      enrichment.ts — API enrichment logic
      probe.test.ts — API probe tests
      probe.ts — API documentation probe
    api.ts — API docs entry
    flags.ts — docs flags
    index.ts — docs entry
    package-page
      enrichment.test.ts — package page tests
      enrichment.ts — package page enrichment
    packages.ts — package metadata
    readme-enrichment.ts — README enrichment
    readme.ts — README generation
    structure-enrichment.ts — structure enrichment
    structure.ts — structure generation
    wiki.ts — wiki helpers
  help.ts — help system
  llm-agents.ts — main entry
  shared
    execution-context.ts — execution context
    index.ts — shared exports
    logging.ts — logging helpers
    repo-actions.ts — repo action helpers
  tests
    baseline.ts — baseline test helpers
    discover.ts — test discovery
    generate.ts — test generation
    index.ts — test entry
    support.ts — test support utilities
    write.ts — test file writing
  validate-models
    probe.ts — model validation probe
    report.ts — model validation report
  validate-models.ts — model validation entry
```

<!-- structure-status: enriched -->
<!-- structure-hash: bd7f8021c05915e8972a8049dc7f84e692bbca309041b8a9c1ad2ae6d15f9bb2 -->
