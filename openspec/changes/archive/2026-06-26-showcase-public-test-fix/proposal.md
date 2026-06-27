## Why

The showcase-public:test validation step is currently failing due to a cached test error, causing the overall validation pipeline to report errors independently of actual code changes. This failure couples the showcase-public validation with unrelated pi-agent changes, increasing implementation risk and blocking progress. Resolving this now isolates the test failure, restores pipeline stability, and prevents false negatives from blocking downstream work.

## What Changes

- Isolate the showcase-public:test validation step to run independently of pi-agent changes.
- Clear and fix the cached test error causing the failure.
- Update validation pipeline configuration to handle the isolated step without blocking unrelated capabilities.

## Capabilities

### New Capabilities
- `showcase-public-test-fix`: Isolate and resolve the cached test failure in the showcase-public validation step to prevent CI coupling and restore pipeline stability.

### Modified Capabilities
None

## Impact

- **Affected code**: showcase-public test suite and validation runner configuration.
- **CI/CD pipeline**: Validation step execution order and caching behavior.
- **Dependencies**: Test caching mechanism, validation signal routing.
- **Systems**: CI validation pipeline, pi-agent integration tests.
