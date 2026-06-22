## Why

showcase-public:test is failing with a cached check error, blocking validation. This error is independent of pi-agent changes, and isolating this remediation allows for parallel or sequential fixes without risking the broader pi-agent approval mode updates.

## What Changes

- Resolve the cached check error in showcase-public:test to restore validation status.
- Isolate showcase-public remediation from pi-agent state to ensure stable check execution.

## Capabilities

### New Capabilities
- fix-showcase-public-check: Remediation to resolve the cached check error in showcase-public:test and restore validation stability.

### Modified Capabilities
- None

## Impact

- showcase-public test suite and check logic.
- Validation pipeline status for showcase-public.
- Potential interaction surface with pi-agent configuration (remediation is isolated to mitigate risk).
