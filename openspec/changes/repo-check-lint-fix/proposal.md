## Why

The `repo-check` CLI is currently non-functional due to a combination of lint errors and malformed JSON output. Lint errors—specifically missing exports in `commands.js`, `context.js`, and `types`—prevent successful execution of `repo-check` commands, while a JSON parsing error in the `format` step (caused by invalid minus-digit parsing) breaks structured output consumption. These issues are tightly coupled: the lint errors cause the CLI to fail before producing output, and the malformed JSON prevents downstream tools from reliably consuming results. Fixing both together restores CLI functionality and ensures reliable, parseable output.

## What Changes

- **Fix lint errors** by adding missing exports in:
  - `commands.js`: export `runStructuredRepoCommand`
  - `context.js`: export `findWorkspaceRoot`, `getGitNexusSnapshot`, `writeJson`
  - `types`: export relevant type definitions (e.g., `RepoCheckHotspotsResult`, `RepoCheckKebabGroupsResult`)
- **Fix malformed JSON output** in the `format` step by correcting invalid minus-digit parsing (e.g., `-` not followed by a digit) in structured output generation
- **Ensure `repo check` step completes successfully** by resolving lint errors that previously caused it to fail

## Capabilities

### New Capabilities
- `repo-check-lint-fix`: Introduces a stable, lint-compliant and JSON-output-valid implementation of the `repo-check` CLI, enabling reliable structured output generation and command execution for repository validation workflows.

### Modified Capabilities
None.

## Impact

- **Code**: `commands.js`, `context.js`, `types.ts`, and output-generating logic in `format` step will be modified.
- **APIs**: No public API changes; only internal exports and JSON serialization behavior are corrected.
- **Dependencies**: None.
- **Systems**: Downstream tools relying on `repo check --json` output (e.g., CI validation pipelines, automated review bots) will now receive valid JSON and can resume structured processing.
