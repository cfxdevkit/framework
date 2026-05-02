# framework/executor

**Scope:** Generic execution primitives for keeper / off-chain automation systems.

**Responsibilities**
- Job queue interface (pluggable backends)
- Retry + backoff policies
- Gas-aware transaction submission
- Idempotency keys

Domain-specific automation strategies (DCA, limit orders, etc.) live in
`@cfxdevkit/automation` and consume this package.
