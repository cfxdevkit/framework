# cfx-keys

**Tier 0b — audit-grade trust boundary.** Carve-out target per
[ADR-0003](../../docs/adr/0003-multi-repo-split.md).

> Anything that touches private keys lives here. The repo perimeter **is**
> the audit perimeter.

## Packages

| Package | npm | Surface |
|---------|-----|---------|
| `services` | `@cfxdevkit/services` | `KeystoreProvider` interface, `keystore-memory`, `keystore-file` (cfx-v1 envelope: Argon2id KEK + per-secret AES-256-GCM with AAD), `crypto` primitives |
| `wallet` | `@cfxdevkit/wallet` | signers (`signerFromKeystore`, `readonlySigner`), hardware adapters (`onekey`, `satochip`), `init` (filesystem keystore convenience), errors |

Future packages staged for this repo (see [ADR-0002](../../docs/adr/0002-keystore.md) — *ADR not yet created*):
`keystore-os`, `keystore-kms`, `keystore-forward`, `wallet/policies`,
`wallet/session-key`, `wallet/batched`.

## Why standalone

1. **Different threat model** — external audit applies to the whole repo.
   Excluding UI/protocol code shrinks the audit ~10×.
2. **Different release cadence** — releases when crypto/security changes,
   not when the UI does.
3. **Different commit access** — `main` requires two reviewers,
   `Signed-off-by`, reproducible build verification.
4. **Smaller blast radius** — only `@noble/*`, `@scure/*`, `viem`, `cive`.
   No React, no Phaser, no Three.js.

## Dependency rules

- **MAY** depend on `@cfxdevkit/core` (over npm range, never workspace
  once carved).
- **MUST NOT** depend on `cfx-ui`, `cfx-domain`, `cfx-tools`.
- **Consumers** SHOULD use **tilde** ranges (`~x.y.z`) to force conscious
  patch upgrades.

## CI requirements (post carve-out)

- `pnpm audit --prod` + `socket.dev` advisory scan on every PR.
- Reproducible build verification (`SOURCE_DATE_EPOCH` pinned).
- CycloneDX SBOM attached to every release.
- `Signed-off-by` enforced.

## Worked example

The keystore stack built in commits `07b6c98` → `60fc6da` is the canonical
example of what this repo ships:

```
core (types/errors/wallet primitives)
   ↓
services (KeystoreProvider + crypto + file backend)
   ↓
wallet (signerFromKeystore + hardware adapters + init)
   ↓
projects/* (consume @cfxdevkit/wallet → call initLocalWallet)
```
