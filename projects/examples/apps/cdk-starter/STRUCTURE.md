# `projects/examples/apps/cdk-starter` — Detailed Structure

```
cdk-starter/
├── README.md                     package overview and usage guide
├── STRUCTURE.md                  this file
├── package.json                  @cfxdevkit/example-cdk-starter (private)
├── tsconfig.json                 TypeScript config
├── vitest.config.ts              Test configuration
├── CHANGELOG.md                  Version history
│
├── src/                          Source code
│   ├── index.ts                  Public API re-exports (sub-paths preferred)
│   ├── demo.ts                   Executable walkthrough — main() entry point
│   │
│   └── demos/                    Executable demos (one per CDK module)
│       ├── chains.ts             Chain catalog, lookup, filter, error handling
│       ├── units.ts              CFX/drip/Gdrip formatting, parsing, token helpers
│       ├── address.ts            Hex ↔ base32 codec, validation, normalization
│       ├── errors.ts             Typed error hierarchy, cause chaining, JSON serialization
│       ├── client-live.ts        Live RPC demo (eSpace + Core Space testnet)
│       └── wallet.ts             Mnemonic, HD derivation, dual-account signing
│
└── test/                         Test suites (vitest, 42 tests)
    ├── chains.test.ts            Chain catalog, getChain, listChains filtering, errors
    ├── units.test.ts             formatCFX, parseCFX, formatGDrip, formatToken, stringifyBigInt
    ├── address.test.ts           hexToBase32, base32ToHex, isBase32Address, getCoreAddress
    ├── errors.test.ts            CfxError hierarchy, isCfxError, toJSON, cause chaining
    ├── client.test.ts            createClient, http transport, chain config validation
    └── wallet.test.ts            deriveAccount, deriveDualAccount, signerFromMnemonic
```

## File Descriptions

### `src/index.ts`
Convenience re-export layer. Re-exports the full CDK API for a single import. For production use, import from sub-paths (`@cfxdevkit/cdk/chains`, etc.) for optimal tree-shaking.

### `src/demo.ts`
Executable walkthrough — the "main" entry point. Runs all 6 demo sections in order:
1. Chains (pure)
2. Units (pure)
3. Address (pure)
4. Errors (pure)
5. Client live (network calls to testnet)
6. Wallet (local only — no broadcast)

Run with: `tsx src/demo.ts`

### `src/demos/*.ts`
Individual demo functions. Each demonstrates a distinct CDK module with realistic examples, live testnet calls (client-live), or local operations (wallet).

### `test/*.test.ts`
Vitest test suites, one per CDK module. All tests are pure unit tests that exercise the public API.
