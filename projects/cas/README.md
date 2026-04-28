# projects/cas — Conflux Automation Site

**Status:** Live mainnet (cas.cfxdevkit.org).

**Apps**
- `apps/frontend/` — Next.js 14 user UI (order builder, dashboard)
- `apps/backend/` — Express API (orders, auth, history)
- `apps/worker/` — Keeper executing automation strategies

**Other**
- `contracts/` — Solidity sources + deployments (mainnet)
- `packages/shared/` — CAS-specific shared types/utils not yet promoted to a domain

**Framework usage (post-migration)**
- `@cfxdevkit/core` — chain client
- `@cfxdevkit/wallet` — session-key signers for keeper
- `@cfxdevkit/wallet-connect` — frontend wallet
- `@cfxdevkit/executor` + `domains/automation` — keeper engine + strategies

**Migration notes**
- Existing `cas/conflux-sdk` content is the primary candidate for promotion to
  `domains/automation` and `framework/executor`.
- High risk: live system; migrate worker last, behind a feature flag.
