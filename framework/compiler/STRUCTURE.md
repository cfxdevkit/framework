# framework/compiler — Detailed Structure

```
compiler/
├── README.md
├── package.json                    @cfxdevkit/compiler
├── tsconfig.json
├── vite.config.ts
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── solc/                       ── Solidity compiler wrapper ──
    │   ├── index.ts
    │   ├── compile.ts              compile(sources, settings) → artifacts
    │   ├── version.ts              solc version resolver + cache
    │   ├── settings.ts             optimizer, evmVersion, output selection
    │   └── errors.ts               typed compile diagnostics
    │
    ├── resolver/                   ── Import resolution ──
    │   ├── index.ts
    │   ├── npm.ts                  resolve "@openzeppelin/..." style imports
    │   ├── local.ts                file:// imports
    │   ├── remappings.ts           Foundry-style remappings
    │   └── cache.ts
    │
    ├── templates/                  ── Curated contract templates ──
    │   ├── index.ts                template registry
    │   ├── erc20/
    │   │   ├── source.sol
    │   │   └── meta.ts             params, defaults, validations
    │   ├── erc721/
    │   ├── erc1155/
    │   ├── ownable-erc20/
    │   └── governor-light/
    │
    ├── verify/                     ── Source verification helpers ──
    │   ├── index.ts
    │   ├── confluxscan.ts
    │   └── standard-json.ts        produce standard-json input
    │
    └── internal/
        └── stream.ts
```

### Public exports map

```
".", "./solc", "./resolver", "./templates", "./verify"
```

### Dependencies

- Runtime: `solc` (peer, version-pinned), `@noble/hashes`.
- Browser-safe: solc wasm path is selected when running in browser.
