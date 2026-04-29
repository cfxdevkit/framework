# framework/services — Detailed Structure

This package is a **container of pluggable service modules**. Each backend lives in its
own subfolder and is a separate `exports` entry; consumers import only what they configure.

```
services/
├── README.md
├── package.json                    @cfxdevkit/services
├── tsconfig.json
├── vite.config.ts                  multi-entry lib build
├── moon.yml
└── src/
    ├── index.ts                    re-exports the interfaces below; backends are sub-paths
    │
    ├── keystore/                   ── Keystore subsystem (see ADR-0002) ──
    │   ├── index.ts                KeystoreProvider interface, AuditLogger
    │   ├── types.ts                Secret, SecretRef, Capability, AuditEntry
    │   ├── audit.ts                file & noop audit sinks
    │   │
    │   ├── kms/                    framework/services/keystore-kms entry
    │   │   ├── index.ts
    │   │   ├── aws.ts              AWS KMS adapter
    │   │   ├── gcp.ts              GCP KMS adapter
    │   │   ├── vault.ts            HashiCorp Vault adapter
    │   │   └── ledger.ts           Ledger HW wallet adapter
    │   │
    │   ├── os/                     framework/services/keystore-os entry
    │   │   ├── index.ts            wraps @napi-rs/keyring
    │   │   └── platforms.md        per-OS notes (macOS/Windows/Linux)
    │   │
    │   ├── file/                   framework/services/keystore-file entry
    │   │   ├── index.ts
    │   │   ├── format.ts           on-disk format spec (versioned)
    │   │   ├── crypto.ts           AES-256-GCM + Argon2id KEK derivation
    │   │   ├── sops.ts             SOPS+age compatibility export/import
    │   │   └── unlock.ts           passphrase prompt flow
    │   │
    │   ├── forward/                framework/services/keystore-forward entry
    │   │   ├── index.ts
    │   │   ├── libsecret-socket.ts D-Bus socket forwarding (Linux host → container)
    │   │   └── ssh-agent.ts        ssh-agent style protocol
    │   │
    │   └── memory/                 tests-only backend
    │       └── index.ts
    │
    ├── crypto/                     ── Crypto primitives ──
    │   ├── index.ts
    │   ├── aes-gcm.ts              AES-256-GCM helpers
    │   ├── kdf.ts                  Argon2id, HKDF
    │   ├── random.ts               CSPRNG wrappers
    │   └── encoding.ts             base64url, hex
    │
    ├── dex/                        ── DEX adapters ──
    │   ├── index.ts                DexAdapter interface (quote, swap, route)
    │   ├── swappi/
    │   │   ├── index.ts
    │   │   ├── router.ts
    │   │   └── pools.ts
    │   └── (future: meson, sushi…)
    │
    ├── tokens/                     ── Token metadata service ──
    │   ├── index.ts
    │   ├── registry.ts             curated token list
    │   └── resolver.ts             on-chain fallback (ERC-20 metadata)
    │
    └── internal/
        └── http.ts                 shared fetch wrapper with retries
```

### Public exports map

```
".", "./keystore",
"./keystore-kms", "./keystore-os", "./keystore-file", "./keystore-forward", "./keystore-memory",
"./crypto", "./dex", "./dex/swappi", "./tokens"
```

### Dependencies

- Runtime: `framework/core`, `@napi-rs/keyring` (optional peer for `keystore-os`),
  `argon2-browser` or `@noble/hashes` for KDF, `age-encryption` for SOPS export.
- Cloud SDKs (AWS/GCP/Vault) are **optional peer deps**; only installed where needed.

### Boundary

- MAY depend on `framework/core` only.
- Each keystore backend is independently published-friendly (separate exports entry).
