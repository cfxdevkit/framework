# framework/devnode

**Scope:** Lifecycle helpers for spawning a local Conflux node (`@xcfx/node`) for tests and dev.

**Responsibilities**
- Start/stop a local node with deterministic config
- Pre-funded test accounts
- Snapshot/restore for test isolation

**Dev-only.** Must not be a runtime dependency of any application bundle.
