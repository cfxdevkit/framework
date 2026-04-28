# tools — Detailed Structure

Shared dev-only configuration and small helper scripts. Everything here is
consumed via workspace dependencies, never imported at runtime.

```
tools/
├── README.md
│
├── tsconfig/                       ── Base tsconfig files ──
│   ├── package.json                @cfxdevkit/tsconfig (private)
│   ├── base.json                   strict, ES2022, moduleResolution bundler
│   ├── lib.json                    extends base; declaration, sourceMap
│   ├── app-web.json                extends base; jsx react-jsx, dom libs
│   ├── app-node.json               extends base; node libs
│   └── README.md
│
├── biome-config/                   ── Shared Biome config ──
│   ├── package.json                @cfxdevkit/biome-config (private)
│   ├── biome.json                  extended by every package
│   ├── rules/
│   │   ├── no-keytar.json          forbid keytar imports (ADR-0002)
│   │   └── no-console-key.json     forbid console-log of Hex / privatekey shapes
│   └── README.md
│
├── moon-config/                    ── Shared moon task templates ──
│   ├── README.md
│   ├── tasks/
│   │   ├── lib.yml                 build/test/typecheck/lint for libraries
│   │   ├── app-web.yml             vite build for web apps
│   │   ├── app-node.yml            vite SSR build for node apps
│   │   ├── contracts.yml           hardhat compile/test
│   │   └── firmware.yml            platformio
│   └── workspace.yml.example
│
├── codegen/                        ── Code generators ──
│   ├── README.md
│   ├── contracts-extract/          extracts ABI/bytecode → framework/contracts
│   │   ├── package.json            @cfxdevkit/codegen-contracts (private)
│   │   ├── moon.yml
│   │   └── src/
│   │       ├── index.ts            CLI
│   │       ├── extract.ts
│   │       └── render.ts
│   ├── wagmi/                      wagmi codegen wrapper (per-project)
│   │   └── README.md
│   └── api-types/                  OpenAPI → TS for backend ↔ frontend
│       └── README.md
│
├── release/                        ── Release automation ──
│   ├── README.md
│   ├── changesets/
│   │   ├── config.json
│   │   └── README.md
│   ├── scripts/
│   │   ├── publish-framework.ts    runs in CI workflow
│   │   ├── version-bump.ts
│   │   └── verify-provenance.ts
│   └── policies/
│       └── semver.md
│
└── git-hooks/                      ── Pre-commit / commit-msg enforcement ──
    ├── README.md
    ├── package.json                @cfxdevkit/git-hooks (private; sets up lefthook)
    ├── lefthook.yml
    ├── hooks/
    │   ├── pre-commit/
    │   │   ├── biome.sh
    │   │   ├── secret-scan.sh      gitleaks
    │   │   └── private-key-scan.sh custom regex for hex private-key shapes
    │   └── commit-msg/
    │       └── conventional.sh
    └── README.md
```

### Conventions

- All packages here are **private** (`"private": true` in package.json).
- Versioned alongside framework but consumed by every workspace.
