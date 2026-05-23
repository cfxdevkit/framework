## Context

The `format` phase in the CI pipeline is failing due to malformed JSON output generated during the `format` step. Specifically, the output file `output.json` contains an invalid JSON token: a stray minus sign (`-`) appearing before a digit without a preceding number (e.g., `-5` instead of `-5` being valid, but `- 5` or `-` followed by whitespace or non-digit characters would be invalid). In this case, the error signal indicates `× Minus must be followed by a digit`, pointing to line 3, column 21 of `output.json`.

This issue originates in the `format` phase of the tooling pipeline (`cdk /workspaces/root` → `pnpm run tooling -- -- repo check docs --json`), where structured output is emitted for downstream consumption (e.g., by `repo check docs`). The malformed JSON breaks parsing in dependent services, causing cascading failures across the artifact generation pipeline.

Stakeholders include:
- Platform engineers relying on stable JSON outputs for automation
- CI/CD maintainers responsible for pipeline reliability
- Documentation tooling authors expecting valid structured input

Constraints:
- The fix must preserve the existing output schema and semantics.
- No changes to the `--json` flag behavior or CLI contract are allowed.
- The fix must be backward-compatible and not introduce new dependencies.

## Goals / Non-Goals

**Goals:**
- Eliminate malformed JSON output in the `format` phase by ensuring all numeric literals are correctly formatted (i.e., minus signs only appear as part of valid negative numbers).
- Restore successful execution of `pnpm run format` and downstream `repo check docs --json`.
- Maintain full compatibility with existing tooling contracts and output structure.

**Non-Goals:**
- Refactoring the `format` phase logic or changing its output schema.
- Introducing new validation layers or external libraries solely for this fix.
- Modifying the behavior of `--json` or other CLI flags beyond fixing the parsing error.

## Decisions

**1. Root Cause: Incorrect stringification of numeric values in JSON serialization**

The error suggests that a numeric value (e.g., `-5`) is being incorrectly serialized—likely as a string like `" -5"` or `"-" + "5"`—instead of a proper JSON number. This may occur if:
- A numeric field is being cast to a string before serialization.
- A template or interpolation logic prepends a minus sign without ensuring digit context (e.g., `-${value}` where `value` is `"5"` → `"-5"` is fine, but if `value` is `null` or `undefined`, it may produce `"-"` or `" -"`).

**Decision:** Audit all JSON serialization paths in the `format` phase to ensure numeric fields are emitted as native JSON numbers, not strings. Specifically, inspect any code that constructs JSON manually (e.g., via string concatenation or template literals) and replace with `JSON.stringify()` where possible.

**Rationale:** `JSON.stringify()` guarantees valid JSON number formatting (including negative numbers), whereas manual string construction is error-prone and fragile. This is the minimal, safest fix.

**2. Avoid adding a pre-flight JSON validator**

**Decision:** Do *not* add a separate JSON validation step before output. Instead, fix the source of the malformed output.

**Rationale:** Adding validation would only mask the root cause and increase pipeline latency. Since the error is deterministic and localized, fixing the serialization logic is more efficient and maintainable.

**3. Preserve output schema and field names**

**Decision:** Retain all existing field names, structure, and ordering in `output.json`. Only correct the malformed value.

**Rationale:** Changing schema—even subtly—could break downstream consumers expecting strict compatibility. The goal is remediation, not evolution.

**4. Use strict type assertions in serialization code**

**Decision:** Where manual JSON construction is unavoidable (e.g., for performance or streaming), wrap numeric fields with explicit type guards (e.g., `typeof value === 'number' && !isNaN(value)`) before serialization.

**Rationale:** Prevents accidental stringification or null/undefined coercion. This is defensive programming for high-risk paths.

## Risks / Trade-offs

- **[Risk]** Over-correction: Fixing one malformed case may expose other latent formatting bugs (e.g., unescaped quotes, invalid control characters).  
  → **Mitigation:** Run full test suite on `format` output, including edge cases (negative zero, NaN, Infinity, large integers). Add regression tests for known failure modes.

- **[Risk]** Hidden dependency on `--json` flag behavior in other tools may cause side effects if serialization logic is refactored.  
  → **Mitigation:** Isolate the `format` phase’s JSON output logic into a dedicated module (`src/format/json-output.ts`) with unit tests. Ensure `--json` flag only toggles *format* (not *content*).

- **[Risk]** Performance regression if `JSON.stringify()` is used in hot paths.  
  → **Mitigation:** Benchmark before/after. If needed, use streaming or incremental serialization—but only if profiling justifies it.

## Migration Plan

1. **Local Reproduction & Diagnosis**
   - Run `pnpm run format` locally.
   - Inspect `output.json` and identify the exact malformed token (e.g., line 3, col 21).
   - Trace back to the source field and serialization code.

2. **Fix Serialization Logic**
   - Replace manual string-based JSON construction with `JSON.stringify()` or validated numeric coercion.
   - Add unit tests for negative number serialization (e.g., `-0`, `-1e10`, `-Infinity` → `null` or error as appropriate).

3. **Validation & Regression Testing**
   - Add a CI step to validate `output.json` against a JSON schema (e.g., `ajv-cli`) as a smoke test.
   - Extend existing `format` tests to cover malformed input scenarios.

4. **Deployment**
   - Merge fix to `main`.
   - Re-run `pnpm run format` in CI to confirm success.
   - Notify downstream consumers (e.g., `repo check docs`) to verify parsing resumes.

5. **Rollback Strategy**
   - If issue persists, revert the commit. No state changes are made—this is purely code fix.
   - No database or config migrations involved.

## Open Questions

- **Q:** Should we deprecate manual JSON construction entirely and enforce `JSON.stringify()` across the codebase?  
  → **A:** Out of scope for this fix, but tracked as a follow-up tech debt item.

- **Q:** Is the malformed output due to a specific data value (e.g., `null` coerced to `"-"`) or a structural bug (e.g., missing fallback)?  
  → **A:** Needs local debugging to confirm; design assumes data-level issue. If structural, update data normalization logic.

- **Q:** Should we add a CI lint rule (e.g., `no-string-concat-json`) to prevent recurrence?  
  → **A:** Consider post-merge; not required for this remediation.
