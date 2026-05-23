## 1. Diagnose Root Cause

- [ ] 1.1 Identify the exact location in the `format` phase where the stray minus sign is introduced
- [ ] 1.2 Inspect JSON serialization logic in the `format` phase to locate malformed numeric output
- [ ] 1.3 Reproduce the error locally using `pnpm run format` and capture full stack trace

## 2. Fix Malformed Output

- [ ] 2.1 Locate the code responsible for generating numeric values in the JSON output during formatting
- [ ] 2.2 Ensure numeric values are serialized without leading stray minus signs (e.g., `-123` → `123` if unintended)
- [ ] 2.3 Validate that all numeric fields conform to JSON spec (no non-digit characters before digits)

## 3. Add Validation and Safeguards

- [ ] 3.1 Implement JSON output validation step in the `format` phase to catch malformed JSON early
- [ ] 3.2 Add unit tests for JSON serialization edge cases involving negative numbers and special formatting
- [ ] 3.3 Integrate a pre-commit hook or CI check to validate JSON syntax before artifact generation

## 4. Verify Fix

- [ ] 4.1 Re-run `pnpm run format` and confirm no parse errors occur
- [ ] 4.2 Validate generated `output.json` against a JSON parser (e.g., `jq`, `node -p`)
- [ ] 4.3 Run full `repo check docs` pipeline to ensure downstream parsing succeeds
