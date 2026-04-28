# domains/automation

**Scope:** Off-chain automation strategies executable by `framework/executor`.

**Responsibilities**
- Strategy interface (`evaluate`, `buildTx`, `verify`)
- Built-in strategies: limit order, DCA, scheduled tx, condition-based
- Strategy persistence schema
- Backtesting helpers

**Non-goals**
- Keeper transport / queue (lives in `framework/executor`).
- Project-specific UI (lives in `projects/cas/apps/frontend`).

**Origin:** `cas/conflux-cas/worker` patterns + `cas/conflux-sdk` automation types.
