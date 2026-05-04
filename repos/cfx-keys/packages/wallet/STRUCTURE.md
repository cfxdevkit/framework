# @cfxdevkit/wallet — Detailed Structure

```
wallet/
├── README.md
├── package.json                    @cfxdevkit/wallet
├── tsconfig.json
├── vite.config.ts
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── session-key/                ── Session keys (default automated signer) ──
    │   ├── index.ts
    │   ├── derive.ts               in-memory derivation from a parent signer
    │   ├── capability.ts           Capability schema (chain, contract, selector, value cap)
    │   ├── policy.ts               Policy enforcement at sign-time
    │   ├── lifecycle.ts            issue / rotate / revoke / expire
    │   └── store.ts                ephemeral storage (RAM only)
    │
    ├── batched/                    ── Batched txs ──
    │   ├── index.ts
    │   ├── multicall.ts            read batching
    │   ├── multisend.ts            write batching (delegate-call multisend)
    │   └── nonce.ts                nonce manager for sequential sends
    │
    ├── signers/                    ── Signer wrappers ──
    │   ├── index.ts
    │   ├── from-keystore.ts        wraps any KeystoreProvider as a Signer
    │   ├── from-hardware.ts        Ledger / Trezor wrapper (re-exports services/keystore-kms/ledger)
    │   └── readonly.ts             watch-only address signer
    │
    ├── hardware/                   ── Vendor hardware wallet adapters ──
    │   ├── index.ts                common adapter types and helpers
    │   ├── ledger/                 Ledger adapter, sharing services/keystore-ledger signer
    │   ├── onekey/                 OneKey adapter
    │   └── satochip/               Satochip adapter
    │
    ├── policies/                   ── Reusable policy presets ──
    │   ├── index.ts
    │   ├── allowlist.ts
    │   ├── value-cap.ts
    │   └── time-window.ts
    │
    └── internal/
        └── tx.ts                   tx assembly helpers
```

### Public exports map

```
".", "./session-key", "./hardware", "./hardware/ledger", "./hardware/onekey", "./hardware/satochip", "./signers", "./policies"
```

### Dependencies

- Runtime: `@cfxdevkit/core`, `@cfxdevkit/services` (for keystore interface).

### Security note

This package is the **only blessed entrypoint for automated signers**. Any project
that needs a non-interactive signer MUST go through `wallet/session-key` or `wallet/signers/from-hardware`.
