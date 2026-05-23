## Why

The format phase currently produces malformed JSON output containing a stray minus sign before a digit, which causes downstream JSON parsing failures across the tooling pipeline. This issue blocks reliable artifact generation and must be resolved immediately to restore correctness in the `cdk` and `repo check docs` workflows.

## What Changes

- Fix the JSON serialization logic in the format phase to ensure valid JSON structure (no stray minus signs before digits).
- Enforce strict JSON output validation during the format phase to prevent malformed output from propagating.
- Update error reporting to clearly indicate JSON parse failures and their location in the output stream.

## Capabilities

### New Capabilities
- `fix-format-json-parse-error`: Introduces a new capability to ensure the format phase produces syntactically valid JSON, including validation logic and error handling for malformed numeric literals.

### Modified Capabilities
None.

## Impact

- **format phase**: Core logic must be updated to prevent invalid JSON generation.
- **Downstream consumers**: Tools relying on `output.json` (e.g., `repo check docs`, `cdk` CLI) will resume reliable operation once the fix is applied.
- **Error handling**: New validation logic will surface parse errors earlier in the pipeline, improving developer feedback.
