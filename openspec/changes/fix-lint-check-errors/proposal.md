## Why

Lint and check errors in core tooling and pi-agent indicate correctness issues that block safe OpenSpec artifact generation. Specifically, an assignment-in-expression pattern in `src/wiki-validate.ts` violates ESLint best practices, and a missing type export (`StatusReport`) in pi-agent causes lint failures. These errors must be resolved before proceeding with spec development to ensure a clean, reliable codebase.

## What Changes

- Fix assignment-in-expression lint error in `src/wiki-validate.ts:135` by extracting assignment from conditional expression.
- Add missing `StatusReport` type export in pi-agent to resolve lint failure.
- Ensure all tooling and pi-agent lint/check passes before OpenSpec artifact generation proceeds.

## Capabilities

### New Capabilities
- `fix-lint-check-errors`: Introduces a remediation capability to resolve critical lint and type-check errors in core tooling and pi-agent, ensuring code correctness and readiness for spec generation.

### Modified Capabilities
- None

## Impact

- **Affected files**: `src/wiki-validate.ts`, pi-agent source files (specifically where `StatusReport` is defined/used).
- **No breaking changes**: This is a pure correctness fix with no API or behavioral changes.
- **Dependencies**: No external dependencies affected; internal tooling and type definitions updated.
- **Systems**: Improves reliability of CI linting pipeline and ensures clean state for downstream OpenSpec workflows.
