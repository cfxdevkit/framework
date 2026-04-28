# projects/chainbrawler — On-chain RPG

**Apps**
- `apps/web-ui/` — Vite + Mantine frontend

**Other**
- `contracts/` — Hardhat RPG contracts
- `packages/game-rules/` — RPG-specific rules (kept project-local)
- `packages/react-bindings/` — UI ↔ engine adapter (kept project-local until reusable)

**Framework usage (post-migration)**
- `@cfxdevkit/core`, `@cfxdevkit/react`, `@cfxdevkit/wallet-connect`
- `domains/game-engine` for state-machine + turn engine

**Migration notes**
- Extract engine-shaped pieces of today's `packages/core` to `domains/game-engine`.
- RPG-specific game rules stay here.
- Today's `packages/utils` (dev orchestrator) → re-evaluate; promote to `platform/` if generally useful.
