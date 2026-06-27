## Context

The `showcase-local` build pipeline currently fails during the `typecheck` phase. The underlying build tool enforces strict static analysis and detects dynamic file tracing operations (e.g., `require('./' + foo)` or `path.join`/`fs.readFile` within the import graph). This triggers an "unexpected file in NFT list" error and causes the entire project to be unintentionally traced, breaking the deterministic dependency graph required for stable builds.

The current state relies on dynamic resolution patterns to load CLI commands and showcase modules. While functional at runtime, these patterns violate the static tracing constraints of the modern build toolchain, leading to the `showcase-local:build` typecheck error.

## Goals / Non-Goals

**Goals:**
- Eliminate dynamic requires and filesystem operations from the `showcase-local` import trace.
- Replace dynamic resolution with explicit, statically analyzable `import` statements.
- Restore `pnpm run typecheck` and `pnpm run check` to a passing state without altering runtime command behavior.
- Stabilize the build trace to prevent unintended full-project scanning.

**Non-Goals:**
- Refactoring the underlying CLI command logic or runtime execution flow.
- Modifying the build tool configuration to bypass static analysis constraints.
- Addressing dynamic tracing issues in unrelated workspace packages.

## Decisions

**1. Replace Dynamic `require()` with Explicit Static Imports**
- *Rationale:* The build tool's static analyzer cannot resolve concatenated paths or runtime-generated module names. Explicit imports create a deterministic dependency graph, satisfying the tool's tracing requirements.
- *Alternatives Considered:* 
  - Using `require.resolve()` with static strings: Rejected, as it still triggers tracing warnings and doesn't align with modern ES module standards.
  - Configuring the bundler to ignore dynamic traces: Rejected, as this masks maintainability issues and risks future build regressions.

**2. Structure Imports Explicitly per Command/Module**
- *Rationale:* Aligning with the lint diff signals, each CLI command (`derive`, `generate`, `keystore`, `status`, `units`) will be imported explicitly. This removes the need for runtime directory scanning or dynamic module loading.
- *Alternatives Considered:* 
  - Barrel files (`index.js`) with re-exports: Rejected, as some bundlers still struggle with dynamic re-exports during strict tracing phases.
  - `import()` dynamic expressions: Rejected, as they introduce asynchronous loading and may not satisfy the synchronous static analysis requirements of the typecheck phase.

**3. Maintain Runtime Compatibility via Static Mapping**
- *Rationale:* The change is purely structural. By mapping command names to explicit imports, we preserve the existing runtime dispatch logic while satisfying static analysis.

## Risks / Trade-offs

- [Risk] Increased bundle size or import overhead due to explicit imports. → [Mitigation] Modern bundlers and tree-shaking will eliminate unused exports. Explicit imports are standard and performant.
- [Risk] Breaking changes if other modules implicitly relied on the dynamic resolution pattern. → [Mitigation] Scope changes strictly to `showcase-local` and its direct CLI entry points. Run full integration tests to verify downstream compatibility.
- [Trade-off] Slightly more verbose code vs. build stability and faster static analysis. → [Mitigation] The trade-off favors long-term maintainability and CI/CD reliability over minor code brevity.

## Migration Plan

1. **Identify & Map:** Audit the `showcase-local` import trace to locate all dynamic `require()` calls and filesystem operations.
2. **Refactor Imports:** Replace dynamic paths with explicit `import` statements for each command/module, following the structure shown in the lint diff.
3. **Validate Build:** Run `pnpm run typecheck` and `pnpm run check` to confirm the "unexpected file in NFT list" error is resolved and the trace is stable.
4. **Test & Deploy:** Execute the full test suite to ensure runtime behavior remains unchanged. Deploy via standard PR workflow.
5. **Rollback Strategy:** If the build pipeline fails post-merge, revert the commit. The dynamic requires were functionally correct at runtime, so rollback immediately restores build functionality.

## Open Questions

- Are there other workspace packages utilizing similar dynamic tracing patterns that may require proactive remediation to prevent downstream build failures?
- Does the build tool support synchronous `import()` or `createRequire()` if static imports become too verbose for certain legacy modules, or must we strictly adhere to static `import` syntax?
