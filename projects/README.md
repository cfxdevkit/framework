# projects/  — Tier 3: Consumer Applications

End-user applications. Each project:

- Has its own deploy lifecycle (see `infrastructure/<project>/`).
- Owns its smart contracts (if any) under `contracts/`.
- May contain project-specific `packages/` for code that does **not** belong in `repos/cfx-domain`.
- Consumes the shared packages from `repos/cfx-*` according to the architectural tier rules.

## Standard project layout

```
projects/<name>/
├── README.md
├── apps/                  # Deployable units (frontend, backend, worker, firmware, …)
├── packages/              # Project-internal libraries (optional)
├── contracts/             # Solidity sources + deploy scripts (optional)
└── e2e/                   # Cross-app end-to-end tests (optional)
```

In the current workspace, reusable code that is shared beyond a single project
should normally live in one of the `repos/cfx-*` slices rather than under
`projects/<name>/packages/`.

## Projects

| Project | Description | Source today |
|---------|-------------|--------------|
| [cas/](cas/) | Non-custodial limit-order & DCA automation | `cas/` |
| [chainbrawler/](chainbrawler/) | On-chain RPG game | `chainbrawler/` |
| [conflux-phaser/](conflux-phaser/) | Phaser-based blockchain game | `conflux-phaser/` |
| [electro/](electro/) | ESP32 hardware + Conflux smart contract | `Electro/` |
