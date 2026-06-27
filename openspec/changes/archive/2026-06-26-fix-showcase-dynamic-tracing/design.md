## Context

The `showcase-local` package currently fails the `showcase-local:build` typecheck step due to the build pipeline detecting dynamic `require()` calls and filesystem operations (`path.join`, `path.resolve`, `fs.readFile`). These patterns trigger the typechecker/bundler to perform speculative, full-project tracing instead of resolving imports statically. This breaks incremental build caching, causes cross-package contamination, and destabilizes local development and CI pipelines. The monorepo's build system relies on static, analyzable import graphs to maintain type safety and build isolation. This design addresses the motivation outlined in the change proposal by isolating the `showcase-local` build path and eliminating the patterns that trigger unintended tracing.

## Goals / Non-Goals

**Goals:**
- Eliminate dynamic `require()` calls and unbounded filesystem operations within the `showcase-local` build path.
- Configure `showcase-local` to use static, analyzable imports that the typechecker can resolve without speculative tracing.
- Enforce package boundaries via explicit `tsconfig` and bundler settings to prevent cross-package contamination.
- Restore `showcase-local:build` typecheck to a passing state while preserving existing runtime functionality.

**Non-Goals:**
- Refactoring the core CLI command structure or addressing unrelated `cli:lint` and `wallet:build` errors.
- Modifying the monorepo's root build configuration or typechecker defaults.
- Implementing a generic plugin system or runtime module loader.

## Decisions

- **Replace Dynamic Requires with Static or Explicit Conditional Imports.** Dynamic patterns like `require('./' + foo)` will be replaced with static imports or `import()` statements that reference known, explicitly exported modules. Rationale: Static imports are fully analyzable by the typechecker and bundler, eliminating speculative tracing. Alternatives considered: Adding build-time ignore flags to suppress the error; rejected because it masks the root cause and risks runtime resolution failures.
- **Isolate Filesystem Operations in a Bounded Utility Module.** All `fs` and `path` operations will be extracted from business logic into a dedicated `showcase-local/fs-utils.ts` module. This module will export only the necessary functions with strict type signatures. Rationale: Centralizing side effects creates a single, bounded dependency that the build system can trace safely. It also simplifies mocking in unit tests and prevents scattered filesystem calls from polluting the import graph. Alternatives considered: Wrapping operations in try/catch blocks; rejected because it does not resolve the tracing behavior.
- **Enforce Build Isolation via Package-Level `tsconfig` and Path Mapping.** `showcase-local` will receive a dedicated `tsconfig.json` with explicit `rootDir`, `outDir`, and `paths` mappings that restrict resolution to within the package. Rationale: Compile-time path enforcement ensures the typechecker only resolves modules inside `showcase-local`, preventing accidental cross-package imports that trigger full-project tracing. Alternatives considered: Modifying the root `tsconfig`; rejected as it violates the isolation principle and impacts other packages.
- **Adopt Build-Time Constants for Environment-Specific File Paths.** Where filesystem paths are determined by environment variables or build flags, they will be injected at compile time rather than resolved at runtime. Rationale: Compile-time resolution guarantees static analyzability. Alternatives considered: Runtime path construction; rejected as it reintroduces dynamic tracing risks.

## Risks / Trade-offs

- [Risk] Runtime behavior changes if dynamic module loading was intentionally used for extensibility. → Mitigation: Audit all dynamic requires; if extensibility is required, implement a formal plugin registry with static entry points and explicit exports.
- [Risk] Increased maintenance overhead for the isolated `fs-utils` module. → Mitigation: Keep the module minimal, add comprehensive JSDoc, and enforce strict typing. Unit tests will cover all exported functions.
- [Risk] Build configuration changes may conflict with existing monorepo tooling or CI expectations. → Mitigation: Validate against the current CI pipeline in a feature branch. Use a temporary build flag if necessary during rollout, with a clear deprecation path.
- [Risk] Static imports may increase initial bundle size if unused modules are pulled in. → Mitigation: Use tree-shaking-friendly exports and verify bundle analysis post-refactor. Lazy `import()` will be used for heavy, non-critical modules.

## Migration Plan

1. **Audit & Inventory:** Scan `showcase-local` for all dynamic `require()` calls and `fs`/`path` operations. Document their usage and runtime dependencies.
2. **Refactor Code:** Replace dynamic requires with static imports. Extract filesystem operations into `fs-utils.ts`. Inject build-time constants where applicable.
3. **Update Build Config:** Create/update `showcase-local/tsconfig.json` with strict path resolution and isolation settings. Verify compatibility with the existing bundler.
4. **Local Validation:** Run `pnpm run typecheck` and `showcase-local:build` locally. Confirm no speculative tracing occurs and all types resolve correctly.
5. **CI Integration:** Update the CI pipeline to run the `showcase-local:build` typecheck step. Monitor for regressions in dependent packages.
6. **Rollback Strategy:** If typecheck fails or runtime errors emerge, revert to the previous commit. The isolated nature of this change ensures a clean revert without cross-package side effects.

## Open Questions

- Are there any legitimate use cases for dynamic module loading in `showcase-local` that require runtime resolution, or can all dependencies be statically resolved?
- Does the current bundler support `import()` for dynamic modules without triggering full tracing, or must we strictly enforce static imports for this package?
- How should the unrelated `cli:lint` errors be tracked and addressed? (Out of scope for this change, but will be logged as a separate remediation task.)
