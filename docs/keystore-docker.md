# Local Secure Keystore (Docker)

`@cfxdevkit/wallet` ships with a turn-key local keystore — `initLocalWallet`
opens (or creates) `~/.cfxdevkit/keystore.json`, sealed with Argon2id +
AES-256-GCM (`cfx-v1` envelope from `@cfxdevkit/services/keystore-file`).

For shared CI runners, multi-tenant deployments, or any host where the OS user
boundary is insufficient, you can run the keystore inside a hardened container
and bind-mount only the encrypted file. The host application keeps using
`initLocalWallet` / `openLocalWallet` exactly as before — only the on-disk
location changes.

This guide covers two production patterns:

1. **In-process keystore in a sealed container** — simplest; the container
   *is* the application. Best for batch jobs, schedulers, and one-shot CLI
   tooling.
2. **Sidecar keystore + host bridge** — the keystore lives in a long-running
   container; the application running on the host (or another container)
   talks to it over a Unix socket. Best for development, hot-reload, and
   multi-language consumers.

> **Threat model.** Docker is *not* a hardware secure element. Treat the
> container as a strong privilege boundary, not as tamper-resistant storage.
> For high-value keys, combine this recipe with one of the hardware adapters
> (`@cfxdevkit/wallet/hardware/{onekey,satochip}`) or a remote KMS.

---

## Pattern 1 — In-process keystore (single container)

The application and the keystore share a process. Only the encrypted
envelope is persisted on a named volume; the passphrase is supplied at
runtime through Docker secrets.

### `docker-compose.yml`

```yaml
services:
  wallet:
    image: node:22-alpine
    user: "10001:10001"               # non-root, fixed uid/gid
    read_only: true                   # rootfs immutable
    tmpfs:
      - /tmp:size=16m,mode=1777,noexec,nosuid,nodev
    cap_drop: ["ALL"]                 # no Linux capabilities
    security_opt:
      - no-new-privileges:true
    environment:
      CFXDEVKIT_KEYSTORE: /var/cfxdevkit/keystore.json
      # Passphrase comes from a Docker secret, never from the env directly.
      CFXDEVKIT_PASSPHRASE_FILE: /run/secrets/cfx_passphrase
    secrets:
      - cfx_passphrase
    volumes:
      - cfx-keystore:/var/cfxdevkit:rw
      - ./app:/app:ro
    working_dir: /app
    command: ["node", "--experimental-strip-types", "src/main.ts"]

volumes:
  cfx-keystore:
    driver: local

secrets:
  cfx_passphrase:
    file: ./secrets/passphrase.txt    # mode 0600 on host; gitignored
```

### `src/main.ts`

```ts
import { readFileSync } from 'node:fs';
import { initLocalWallet, openLocalWallet } from '@cfxdevkit/wallet/init';
import { existsSync } from 'node:fs';

const passphrase = readFileSync(process.env.CFXDEVKIT_PASSPHRASE_FILE!, 'utf8').trim();
const path = process.env.CFXDEVKIT_KEYSTORE!;

const wallet = existsSync(path)
  ? await openLocalWallet({ passphrase, path })
  : await initLocalWallet({ passphrase, path });

if ('mnemonic' in wallet) {
  // First boot — print the mnemonic ONCE for offline backup, then refuse to
  // start until the operator confirms it's been written down.
  console.error('BACK UP THIS MNEMONIC NOW:', wallet.mnemonic);
  process.exit(2);
}

console.log('signer ready:', wallet.signer.account.address);
```

### Hardening notes

| Setting | Purpose |
|---|---|
| `user: "10001:10001"` | Run as a fixed non-root uid; avoids root-in-container surprises. |
| `read_only: true` + `tmpfs:/tmp` | Filesystem is immutable except for the volume + tmpfs. |
| `cap_drop: ["ALL"]` | Drops every Linux capability — keystore needs none. |
| `no-new-privileges` | Disables setuid/file-cap escalation. |
| Docker secret (file) | Passphrase never appears in `docker inspect`, env dumps, or layer history. |
| Named volume (not bind mount) | The encrypted file is owned by the container UID, not the host user. |

To run:

```bash
mkdir -p secrets && head -c 32 /dev/urandom | base64 > secrets/passphrase.txt
chmod 600 secrets/passphrase.txt
docker compose up wallet         # first boot: prints mnemonic, exits 2
# … back up the mnemonic out-of-band …
docker compose up wallet         # subsequent boots: signer ready
```

---

## Pattern 2 — Sidecar keystore with host bridge

The keystore container exposes a small JSON-RPC service over a Unix socket
on a shared volume. Host applications (or other containers) connect to the
socket; the encrypted envelope and the unlocked KEK both stay inside the
container's memory.

### `docker-compose.yml`

```yaml
services:
  cfx-keystore:
    image: ghcr.io/your-org/cfx-keystore:latest
    user: "10001:10001"
    read_only: true
    tmpfs: ["/tmp:size=16m,noexec,nosuid,nodev"]
    cap_drop: ["ALL"]
    security_opt: ["no-new-privileges:true"]
    environment:
      CFXDEVKIT_KEYSTORE: /var/cfxdevkit/keystore.json
      CFXDEVKIT_PASSPHRASE_FILE: /run/secrets/cfx_passphrase
      CFXDEVKIT_SOCKET: /run/cfx/keystore.sock
    secrets: [cfx_passphrase]
    volumes:
      - cfx-keystore:/var/cfxdevkit:rw
      - cfx-socket:/run/cfx:rw
    healthcheck:
      test: ["CMD", "test", "-S", "/run/cfx/keystore.sock"]
      interval: 5s
      retries: 6

volumes:
  cfx-keystore:
  cfx-socket:

secrets:
  cfx_passphrase:
    file: ./secrets/passphrase.txt
```

The application (running on the host or in a second container that mounts
the same `cfx-socket` volume) calls into the keystore over the Unix socket
through a *forwarded provider* — see `@cfxdevkit/services/keystore-forward`
(planned). Until that ships, the simplest bridge is plain HTTP over a Unix
domain socket; the wallet adapters in this package treat the resulting
`Signer` exactly like a local one.

### Why a Unix socket and not TCP?

- Filesystem ACLs (uid/gid + mode `0660`) are stronger than network ACLs.
- No accidental exposure on `0.0.0.0`.
- `SO_PEERCRED` lets the keystore identify the calling uid for audit logs.

### Why a sidecar at all?

- The application can be redeployed / restarted without re-prompting for
  the passphrase: the KEK lives in the keystore container's memory.
- Multi-language consumers (Python data jobs, Go services) can share the
  same keystore without each language re-implementing the file format.
- The blast radius of an application RCE is limited to whichever signing
  capabilities the keystore container has been told to honour
  (`Capability` in `@cfxdevkit/services/keystore`).

---

## Backup & disaster recovery

The encrypted envelope (`keystore.json`) is safe to copy off-host as long
as the passphrase is strong enough to resist offline Argon2id attack
(default: 64 MiB × 3 iterations, parallelism 1). Recommended:

```bash
# Snapshot the named volume contents
docker run --rm -v cfx-keystore:/data alpine \
  tar -C /data -czf - . > backup-$(date +%F).tgz
gpg --symmetric --cipher-algo AES256 backup-*.tgz   # belt-and-braces
```

The mnemonic returned by `initLocalWallet` is the **only** offline
recovery path. Back it up on paper or steel; without it, a corrupted
volume + lost passphrase = lost keys.

---

## Where to go next

| Need | Use |
|---|---|
| Hardware-rooted signing on the same host | [`@cfxdevkit/wallet/hardware/onekey`](../framework/wallet/src/hardware/onekey/index.ts) or [`@cfxdevkit/wallet/hardware/satochip`](../framework/wallet/src/hardware/satochip/index.ts) |
| Remote/cloud KMS backend | `@cfxdevkit/services/keystore-kms` (planned) |
| OS keychain (macOS Keychain, Windows DPAPI, libsecret) | `@cfxdevkit/services/keystore-os` (planned) |
| Capability-scoped session keys | `wallet/policies` & `wallet/session-key` (planned) |
