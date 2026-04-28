# projects/conflux-phaser — Phaser Game

**Apps**
- `apps/web/` — Vite + React + Phaser 3 game

**Framework usage (post-migration)**
- `@cfxdevkit/wallet-connect` (replaces hand-rolled RainbowKit setup)
- `@cfxdevkit/core`

**Migration notes**
- Smallest project. Migrate first as a low-risk validation of framework wiring.
- Consider promoting Phaser+wallet integration scaffold to `platform/templates/phaser-game`.
