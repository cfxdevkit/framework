# showcase-backend

Backend companion for the Conflux showcase apps. It provides SIWE authentication, session-key delegation, Solidity compilation, contract template cataloguing, local devnode control, and CORS-safe RPC proxy routes for local Core/eSpace devnode traffic.

## Start

Recommended full showcase workflow:

```bash
pnpm showcase
```

Then open `http://127.0.0.1:5173`. The gateway exposes backend routes through same-origin paths
such as `/api/health`, `/api/devnode/status`, `/api/compile/catalog`, and `/api/rpc/espace`.

Backend-only workflow:

Run from the monorepo root:

```bash
pnpm --filter @cfxdevkit/example-showcase-backend dev
```

The service listens on:

```text
http://127.0.0.1:5174
```

Use `PORT` to override it:

```bash
PORT=5174 pnpm --filter @cfxdevkit/example-showcase-backend dev
```

If a frontend uses another backend URL, start it with `VITE_BACKEND_URL`:

```bash
VITE_BACKEND_URL=http://127.0.0.1:5174 pnpm --filter @cfxdevkit/example-showcase-stack dev
```

## Stack App

For the full-stack UI, run this in a second terminal:

```bash
pnpm --filter @cfxdevkit/example-showcase-stack dev
```

Then open `http://127.0.0.1:5175`.

## Useful Endpoints

- `GET /health` checks backend availability.
- `GET /devnode/status` reports local devnode state.
- `POST /devnode/start` starts the local devnode.
- `POST /devnode/stop` stops the local devnode.
- `POST /auth/verify` verifies SIWE signatures.
- `POST /session-key/issue` issues a session-key attestation.
- `GET /compile/templates` lists Solidity templates.
- `POST /compile` compiles a template.
- `GET /compile/catalog` returns precompiled artifacts.
- `POST /rpc/core` and `POST /rpc/espace` proxy local devnode RPC with browser-safe CORS.