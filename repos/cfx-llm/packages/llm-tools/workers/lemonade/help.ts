// @ts-nocheck

export function help() {
  console.log(`Usage: pnpm run llm -- <command>

Commands:
  models                         List auto-discovered Lemonade models
  actions                        List repo-specific actions
  config show                    Show local Lemonade CLI config
  config set base-url <url>      Pin Lemonade base URL
  config set default-model <id>  Pin default model id
  config set action <name> <id>  Pin model for one repo action
  ask [--quick] "question"       Ask a repo-aware question
  docs-upkeep [flags] [prompt]   Refresh docs checks and upkeep markdown folder-by-folder
    --scope <path>               Limit to one docs folder prefix; repeatable
    --max-folders <n>            Limit folder count for bounded local runs
    --docs-only                  Only scan docs/ instead of every markdown file in the repo
    --write                      Apply complete-file markdown updates proposed by the local LLM
    --yes / -y                   Skip write confirmation prompt
    --quick                      Shorter per-folder artifact generation
    --agent <direct|pi-rpc>      Use direct Lemonade calls or Pi RPC for structured LLM steps
    --pi-provider <name>         Pi provider to use with --agent pi-rpc
    --pi-model <id>              Pi model to use with --agent pi-rpc
    --model <id>                 Override LLM model
  commit [flags] [prompt]        Full commit pipeline:
                                   1. Quality gates (lint, typecheck, tests; opt-in: build)
                                   2. Preflight (gitnexus + git + review)
                                   3. Detect changed scopes
                                   4. Generate structured changelog JSON per scope (serial)
                                   5. Generate structured commit JSON
                                   6. Confirm proposed commit
                                   7. Write changelogs + re-run lint/typecheck/tests
                                   8. Stage explicit file list + commit
    --dry-run                    Show what would happen; skip writes and commit
    --yes / -y                   Skip confirmation prompt
    --force / -f                 Commit even if quality gates fail
    --skip-checks                Skip all quality gates (Phase 1)
    --skip-post-checks           Skip post-generation lint/typecheck/tests after changelog writes
    --skip-tests                 Skip Moon test suite in quality gates
    --with-build                 Also run Moon build in quality gates
    --with-tests                 Explicitly keep Moon test suite enabled (default)
    --agent <direct|pi-rpc>       Use direct Lemonade calls or Pi RPC for agent steps
    --pi-provider <name>          Pi provider to use with --agent pi-rpc
    --pi-model <id>               Pi model to use with --agent pi-rpc
    --quick                      Short LLM calls (faster, less detail)
    --model <id>                 Override LLM model
  run <action> [--quick] [prompt] Run docs-upkeep, test-audit, repo-health, review, plan, architecture, validation
  test-upkeep [flags] [prompt]    Analyse test coverage per package, identify hotspots, and optionally write new test files:
                                   1. Discover packages with vitest.config.ts
                                   2. Build deterministic test inventory (source vs test files)
                                   3. Run vitest per package and capture output
                                   4. LLM: identify hotspots, suggest new tests (sibling context propagated)
                                   5. Optionally write missing test files directly to src/
    --scope <path>               Limit to packages under this path prefix; repeatable
    --max-packages <n>           Limit package count for bounded runs
    --skip-test-run              Skip vitest execution (inventory-only analysis)
    --write                      Write LLM-suggested test files to src/ (new files only, skip existing)
    --yes / -y                   Skip write confirmation prompt
    --quick                      Shorter LLM calls
    --agent <direct|pi-rpc>      Use direct Lemonade calls or Pi RPC for structured LLM steps
    --pi-provider <name>         Pi provider to use with --agent pi-rpc
    --pi-model <id>              Pi model to use with --agent pi-rpc
    --model <id>                 Override LLM model

Examples:
  pnpm run llm:models
  pnpm run llm:config -- set default-model Qwen3-Coder-Next-GGUF
  pnpm run llm:commit
  pnpm run llm:commit -- --dry-run
  pnpm run llm:commit -- --yes
  pnpm run llm:commit -- --agent pi-rpc --pi-provider lemonade --pi-model Qwen3-Coder-Next-GGUF
  pnpm run llm:action -- review
  pnpm run llm:docs-upkeep -- --quick
  pnpm run llm:docs-upkeep -- --quick --write --yes --max-folders 3
  pnpm run llm:docs-upkeep -- --agent pi-rpc --pi-provider lemonade --quick --max-folders 1
  pnpm run llm:docs-upkeep -- --scope docs/architecture --max-folders 1
  pnpm run llm:test-audit
  pnpm run llm:ask -- --quick "Where should a docs alignment scanner live?"

  pnpm run llm:test-upkeep
  pnpm run llm:test-upkeep -- --quick --scope repos/cfx-core/packages/core
  pnpm run llm:test-upkeep -- --scope repos/cfx-keys --max-packages 3
  pnpm run llm:test-upkeep -- --write --yes --scope repos/cfx-core/packages/core
  pnpm run llm:test-upkeep -- --agent pi-rpc --pi-provider lemonade --quick --max-packages 1
  pnpm run llm:test-upkeep -- --skip-test-run --quick
`);
}
