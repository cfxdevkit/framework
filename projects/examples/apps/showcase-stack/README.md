# showcase-stack

Full-stack Conflux showcase that pairs browser wallets with the local `showcase-backend` service.

## Start The App

Run these from the monorepo root:

```bash
pnpm --filter @cfxdevkit/example-showcase-backend dev
pnpm --filter @cfxdevkit/example-showcase-stack dev
```

Then open:

```text
http://127.0.0.1:5175
```

The backend listens on `http://127.0.0.1:5174` by default. If the header says `backend offline`, start the backend command above and refresh the stack app.

## Optional Backend URL

If the backend runs somewhere else, set `VITE_BACKEND_URL` before starting the stack app:

```bash
VITE_BACKEND_URL=http://127.0.0.1:5174 pnpm --filter @cfxdevkit/example-showcase-stack dev
```

## Local Devnode Flow

1. Start the backend and stack app.
2. In the stack app, switch the network selector to `Local`.
3. Open `DevNode Control` and start the devnode.
4. Import a genesis private key into MetaMask or another non-Fluent eSpace-compatible wallet for eSpace flows.
5. Use Fluent Core through the Core wallet pill for `window.conflux` / `cfx_*` flows.

## Wallet Split

`wagmi` is intentionally restricted to non-Fluent eSpace providers. Fluent Core is handled directly through `window.conflux`, which avoids Core network switches triggering eSpace wallet prompts.