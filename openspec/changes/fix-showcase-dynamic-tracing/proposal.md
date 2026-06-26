## Why

The showcase-local build fails during typechecking due to dynamic requires and filesystem operations that trigger unintended full-project tracing. This breaks local development workflows and contaminates cross-package build pipelines. Resolving this immediately stabilizes the build process, ensures isolated typechecking for the showcase module, and prevents CI/CD failures.

## What Changes

- Replace dynamic `require()` calls and runtime filesystem operations in the showcase module with static imports or build-time resolved paths.
- Update `showcase-local` build configuration to explicitly exclude unintended file tracing and isolate the module from full-project dependency resolution.
- Adjust typecheck and lint scripts to prevent cross-package contamination and ensure stable pipeline execution.

## Capabilities

### New Capabilities
- `fix-showcase-dynamic-tracing`: Resolve dynamic requires and filesystem operations causing unintended full project tracing during showcase-local builds.

### Modified Capabilities
- None

## Impact

- **Code/Modules:** `showcase-local` build configuration, dynamic import traces, and related typecheck scripts.
- **Build/CI Systems:** Local development pipelines and CI typecheck/lint stages.
- **Dependencies:** Build tooling configuration and module resolution behavior.
- **Risk:** Low; focused on build isolation and static import resolution without altering runtime API contracts.
