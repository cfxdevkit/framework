# platform/templates

**Scope:** Starter templates consumed by `scaffold-cli`.

Each subfolder is one self-contained template.

| Template | Scope | Source today |
|----------|-------|--------------|
| `minimal-dapp/` | Bare wagmi + viem + framework setup | `devkit-workspace/templates/minimal-dapp` |
| `project-example/` | Full-feature reference dapp | `devkit-workspace/templates/project-example` |
| `wallet-probe/` | Wallet diagnostics tool | `devkit-workspace/templates/wallet-probe` |
| `nextjs-app/` | Next.js + framework | _new (Phase 2), not yet extracted_ |
| `phaser-game/` | Phaser + framework wallet integration | _extracted from conflux-phaser_ |

A template **must** be runnable standalone after scaffolding (no monorepo coupling).
