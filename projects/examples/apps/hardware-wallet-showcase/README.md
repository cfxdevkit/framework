# hardware-wallet-showcase

Keystore management showcase for the Conflux examples suite.

## Scope

This route is intentionally broader than a Ledger-only hardware wallet page:

- `memory` — executable browser demo using `@cfxdevkit/services/keystore-memory` and `signerFromKeystore`.
- `file` — documented encrypted file backend path using the `cfx-v1` envelope, Argon2id, and AES-256-GCM. It is Node/backend scoped because it uses filesystem access.
- `ledger` — interactive WebHID signer flow for Conflux eSpace and Core.
- `onekey` and `satochip` — reserved UI slots for the existing hardware adapter contracts.

## Run

Recommended gateway workflow:

```bash
pnpm showcase
```

Then open `http://127.0.0.1:5173/hardware/`.

Standalone workflow:

```bash
pnpm --filter @cfxdevkit/example-showcase-backend dev
pnpm --filter @cfxdevkit/example-hardware-wallet-showcase dev
```

Ledger connections require a browser with WebHID support and an unlocked device. The memory backend demo does not require hardware.