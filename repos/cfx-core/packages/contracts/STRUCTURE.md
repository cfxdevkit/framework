# framework/contracts — Detailed Structure

This package ships **generated, audited artifacts**. There are no `.sol` sources here
(those live in `projects/<p>/contracts/` or `platform/devtools/contracts/`).

```
contracts/
├── README.md
├── package.json                    @cfxdevkit/contracts
├── tsconfig.json
├── vite.config.ts
├── moon.yml
├── codegen.config.ts               drives extraction from upstream artifacts
└── src/
    ├── index.ts
    │
    ├── erc20/
    │   ├── abi.ts                  typed ABI const
    │   ├── bytecode.ts             optional, where licensing allows
    │   └── addresses.ts            { espaceMainnet: 0x…, … }
    ├── erc721/
    ├── erc1155/
    ├── multicall3/
    ├── swappi/
    │   ├── router/
    │   ├── factory/
    │   └── pair/
    └── conflux/                    Conflux protocol contracts (CSP, sponsor, etc.)
        ├── sponsor/
        └── admin-control/
```

### Public exports map

One sub-path per contract/family: `"./erc20"`, `"./swappi/router"`, etc.

### Codegen pipeline

`tools/codegen/contracts-extract` reads JSON artifacts from the source contracts (in
the project of origin), copies the ABI + selected bytecode into the right subfolder,
and writes typed TS files.

### Versioning

Independent of any contract source repo. A new addresses entry never breaks consumers
because the type is `Partial<Record<ChainName, Address>>`.
