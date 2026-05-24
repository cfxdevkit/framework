export function help() {
  console.log(`Usage: pnpm run llm -- <command>

Commands:
  models                         List models for the resolved LLM provider
  validate-models [flags]        Probe discovered models with cold/hot/json reliability checks
  actions                        List repo-specific actions
  config show                    Show local provider-aware LLM config
  config set provider <id>       Select lemonade, litellm, openai-compat, or github-models
  config set base-url <url>      Pin the current provider base URL
  config set default-model <id>  Pin default model id; omit <id> for interactive picker
  config set request-timeout-ms <ms>  Set provider request timeout in milliseconds
  config set action <name> <id>  Pin model for one repo action
  validate-models [flags]        Validate discovered models with a tiny prompt
    --model <id>                 Probe only one discovered model
    --limit <n>                  Limit number of probed models
    --quick                      Use a smaller response budget
    --no-thinking                Send enable_thinking=false to the local OpenAI-compatible endpoint
  docs-upkeep [flags] [prompt]   Refresh docs checks and upkeep markdown folder-by-folder
                                   Default scope comes from arch-check managed docs; excludes OpenSpec/workflow archives and tooling artifacts
    --scope <path>               Limit to one docs folder prefix; repeatable
    --max-folders <n>            Limit folder count for bounded local runs
    --docs-only                  Only scan docs/ instead of every markdown/mdx file in the repo
    --write                      Apply complete-file markdown updates proposed by the local LLM
    --force / -f                 Force re-run even when a target flow would otherwise treat content as unchanged
    --no-thinking                Send enable_thinking=false to the local OpenAI-compatible endpoint
    --yes / -y                   Skip write confirmation prompt
    --quick                      Shorter per-folder artifact generation
    --agent <direct>             Use the resolved LLM provider directly
    --model <id>                 Override LLM model
  commit [flags] [prompt]        Full commit pipeline:
                                   1. Quality gates (lint, typecheck, tests, build)
                                   2. Preflight (gitnexus + git + review)
                                   3. Detect changed scopes
                                   4. Check package release intent and Changeset coverage
                                   5. Generate structured commit JSON
                                   6. Confirm proposed commit
                                   7. Write a missing Changeset + re-run lint/typecheck/tests
                                   8. Stage explicit file list + commit
    --dry-run                    Show what would happen; skip writes and commit
    --yes / -y                   Skip confirmation prompt
    --force / -f                 Commit even if quality gates fail
    --skip-checks                Skip all quality gates (Phase 1)
    --skip-post-checks           Skip post-generation lint/typecheck/tests after generated writes
    --skip-changeset             Do not create a missing Changeset for publishable package changes
    --changeset-bump <level>     Force generated Changeset bump: patch, minor, or major
    --no-changeset               Alias for intentionally committing without a generated Changeset
    --skip-tests                 Skip Moon test suite in quality gates
    --with-tests                 Explicitly keep Moon test suite enabled (default)
    --skip-build                 Skip Moon build suite in quality gates
    --with-build                 Explicitly keep Moon build suite enabled (default)
    --agent <direct>              Use the resolved LLM provider directly
    --quick                      Short LLM calls (faster, less detail)
    --model <id>                 Override LLM model
  run <action> [--quick] [prompt] Run docs-upkeep, test-audit, repo-health, review, validation, changeset, release-readiness, ci-cd, docs-pipeline
  test-upkeep [flags] [prompt]    Analyse test coverage per package and suggest/write new test files:
                                   1. Discover packages with vitest.config.ts
                                   2. Build deterministic test inventory (source vs test files)
                                   3. Run vitest per package and capture output
                                   4. LLM: identify hotspots, suggest new tests (sibling context propagated)
                                   5. Write missing test files to src/ only when --write is passed
    --write                      Write LLM-suggested test files to src/ (new files only; source must exist)
    --yes / -y                   Skip write confirmation prompt
    --no-write / --dry-run       Analysis and artifact only (default)
    --scope <path>               Limit to packages under this path prefix; repeatable
    --max-packages <n>           Limit package count for bounded runs
    --skip-test-run              Skip vitest execution (inventory-only analysis)
    --quick                      Shorter LLM calls
    --agent <direct>             Use the resolved LLM provider directly
    --model <id>                 Override LLM model

Examples:
  pnpm run llm:models
  pnpm run llm:validate-models -- --no-thinking
  pnpm run llm:config -- set provider lemonade
  pnpm run llm:config -- set provider litellm
  pnpm run llm:config -- set base-url http://host.containers.internal:13305/
  pnpm run llm:config -- set default-model Qwen3-Coder-Next-GGUF
  pnpm run llm:model
  pnpm run llm:config -- set request-timeout-ms 600000
  pnpm run llm:commit
  pnpm run llm:commit -- --dry-run
  pnpm run llm:commit -- --yes
  pnpm run llm:commit -- --yes --changeset-bump patch
  pnpm run llm:action -- review
  pnpm run llm:changeset
  pnpm run llm:release
  pnpm run check:ci
  pnpm run llm:ci-cd
  pnpm run llm:docs-pipeline
  pnpm run llm:docs-upkeep -- --quick
  pnpm run llm:docs-upkeep -- --quick --no-thinking
  pnpm run llm:docs-upkeep -- --force --quick
  pnpm run llm:docs-upkeep -- --quick --write --yes --max-folders 3
  pnpm run llm:docs-upkeep -- --scope docs/architecture --max-folders 1
  pnpm run llm:test-audit
  pnpm run llm:test-upkeep
  pnpm run llm:test-upkeep -- --scope repos/cfx-core/packages/cdk
  pnpm run llm:test-upkeep -- --quick --scope repos/cfx-core/packages/cdk
  pnpm run llm:test-upkeep -- --scope repos/cfx-keys --max-packages 3
  pnpm run llm:test-upkeep -- --write --yes --scope repos/cfx-core/packages/cdk
  pnpm run llm:test-upkeep -- --skip-test-run --quick
  pnpm run llm:docs-upkeep -- --quick --scope repos/cfx-tools/packages/docs-site/content/packages
  pnpm run llm:docs-upkeep -- --quick --write --yes --max-folders 3
`);
}
