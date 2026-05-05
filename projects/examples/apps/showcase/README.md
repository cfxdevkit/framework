# `@cfxdevkit/showcase`

Live, browser-side showcase of the currently-implemented `@cfxdevkit/*`
surface. Drives Core Space (cive) and eSpace (viem) helpers against a chain
of your choice (mainnet / testnet / local).

## Local development

Recommended full-stack workflow:

```sh
pnpm showcase
```

Then open `http://127.0.0.1:5173/showcase/`.

Standalone workflow:

```sh
pnpm install
pnpm --filter @cfxdevkit/example-showcase-backend dev
pnpm --filter @cfxdevkit/example-showcase dev
```

Then visit the URL Vite prints. Pick a chain in the header (`ChainProvider`). The standalone
Vite server proxies `/devnode`, `/compile`, `/rpc`, `/auth`, and `/session-key` to the backend on
port `5174`, matching the gateway routing model.

### Pointing at a local node

The local network uses the showcase backend's `/devnode` lifecycle and `/rpc/{core,espace}`
proxy. From the repo root:

```sh
pnpm --filter @cfxdevkit/example-showcase-backend dev
```

Then switch the app to `Local` and use the DevNode controls in the header.

See [`@cfxdevkit/devnode`](../../../../repos/cfx-core/packages/devnode/README.md)
for the full lifecycle API.
