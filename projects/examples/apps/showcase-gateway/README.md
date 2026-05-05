# showcase-gateway

Single development entry point for the cfxdevkit showcase apps.

## Start

Run from the monorepo root:

```bash
pnpm showcase
```

Then open:

```text
http://127.0.0.1:5173
```

The gateway keeps one public URL and proxies the individual apps by path:

- `/showcase/` -> base SDK showcase
- `/stack/` -> full-stack wallet/backend showcase
- `/browser/` -> browser wallet showcase
- `/keystores/` -> keystore management showcase
- `/hardware/` -> compatibility alias for the keystore management showcase

It also exposes the backend through same-origin routes:

- `/api/health`
- `/api/devnode/status`
- `/api/compile/catalog`
- `/api/rpc/core`
- `/api/rpc/espace`

The child dev servers use fixed internal ports while the gateway remains the stable entry point.
