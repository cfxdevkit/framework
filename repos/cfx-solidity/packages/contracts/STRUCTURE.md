# `@cfxdevkit/contracts` — Detailed Structure

```
contracts/
├── README.md
├── API.md
├── STRUCTURE.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── moon.yml
└── src/
    ├── index.ts                    barrel (re-exports every sub-path)
    ├── index.test.ts
    ├── abis/
    │   ├── index.ts                ERC20/721/1155 + Multicall3 ABIs
    │   └── abis.test.ts
    ├── errors/
    │   └── index.ts                ContractsError + ContractsErrorCode
    ├── read/
    │   ├── index.ts                readContract()
    │   └── read.test.ts
    ├── write/
    │   ├── index.ts                prepareWrite() / sendWrite() / waitForReceipt()
    │   └── write.test.ts
    ├── deploy/
    │   ├── index.ts                deployContract()
    │   └── deploy.test.ts
    ├── erc20/
    │   ├── index.ts                typed ERC-20 helpers
    │   └── erc20.test.ts
    └── test/
        └── mocks.ts                in-memory Client + recording Signer for tests
```

### Dependencies

Single runtime dep besides `@cfxdevkit/cdk`: **viem** (used purely as a pure
encoder/decoder library — no `PublicClient` or `WalletClient` is constructed
here; the framework's `Client.request()` handles transport, the framework's
`Signer.signTransaction()` handles signing). This keeps the boundary tight:
the same code path will support viem 2.x, viem 3.x, etc., as long as the
encoding helpers stay stable.

### Tests

21 unit tests (vitest, node env). All run against the in-memory mock client in
`src/test/mocks.ts` — no live RPC, no anvil. Live-network smoke tests are not
in this package and will land in `tools/testing` (or per-app integration
suites).

### Build

`vite-plugin-dts` emits one `.d.ts` per entry point so each sub-path resolves
independently. Output bundles per sub-path are ~0.4–4 kB.

### Sub-path resolution

`package.json#exports` maps each `./<name>` to `dist/<name>/index.{js,d.ts}`
matching the `vite.config.ts` `lib.entry` map.
