# @cfxdevkit/testing

**Scope:** Shared test utilities used by every package and project. **Test-only.**

**Responsibilities**
- Mock chain client
- Contract test fixtures
- Integration helpers wrapping `framework/devnode`
- Vitest matchers for chain assertions

Dev-dependency only.

## Planned Mock Inventory

This package is the home for reusable test doubles shared across backend logic packages. Add these before automation, protocol consumers, and MCP tools grow their own local mocks:

- `MockJobRepository implements JobRepository` for deterministic automation job tests.
- `MockExecutionRepository implements ExecutionRepository` for execution audit tests.
- `MockKeeperClient implements KeeperClient` with configurable success and error responses.
- `MockPriceSource implements PriceSource` keyed by token pair.
- `jobFactory(type, overrides?)` and `strategyFactory(type, overrides?)` for valid automation fixtures.
- Vitest matchers such as `toBeHexHash()` and `toBeHexAddress()`.

When these land, add `@cfxdevkit/automation` as a test-facing dependency or peer so runtime packages can import only the mocks they need.
