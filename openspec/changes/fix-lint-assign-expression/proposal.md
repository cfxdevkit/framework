## Why

The `llm-agents` validation pipeline is currently blocked by a cached lint error in `src/wiki-validate.ts`. Line 135 contains an assignment used directly inside an expression, which violates the `lint/suspicious/noAssignInExpressions` rule. This pattern is flagged because expressions are typically expected to be side-effect free, and embedding assignments can lead to confusing or hard-to-debug code. Resolving this is necessary to unblock the docs-pipeline, restore lint compliance, and prevent recurring validation failures.

## What Changes

- Refactor `src/wiki-validate.ts` to extract the assignment from the expression on line 135, ensuring it complies with the `noAssignInExpressions` lint rule.
- Preserve the existing functional behavior of the wiki validation logic while adhering to strict lint/suspicious guidelines.
- Clear the cached lint error to restore the `llm-agents:lint` check to a passing state and unblock downstream pipeline stages.

## Capabilities

### New Capabilities
- `fix-lint-assign-expression`: Resolves the `noAssignInExpressions` lint violation in `wiki-validate.ts` by refactoring the assignment to comply with lint/suspicious rules.

### Modified Capabilities
- None

## Impact

- **Code:** `src/wiki-validate.ts` (specifically line 135)
- **Pipeline:** `llm-agents:lint` and `docs-pipeline` validation status
- **Dependencies/APIs:** None. This is a pure lint compliance fix with no external API, interface, or dependency changes.
