# `@cfxdevkit/showcase`

Live, browser-side showcase of the currently-implemented `@cfxdevkit/*`
surface. Drives Core Space (cive) and eSpace (viem) helpers against a chain
of your choice (mainnet / testnet / local).

## Local development

```sh
pnpm install
pnpm --filter @cfxdevkit/example-showcase dev
```

Then visit the URL Vite prints. Pick a chain in the header (`ChainProvider`).

### Pointing at a local node

The `core-local` (`http://127.0.0.1:12537`, chainId `2029`) and
`espace-local` (`http://127.0.0.1:8545`, chainId `2030`) options require a
running Conflux node on those ports. From the repo root:

```sh
pnpm devnode             # builds + starts the dev node (10 funded accounts)
# ── or, with options:
pnpm exec cfxdevkit-devnode --accounts 4 --balance 1000 --logging
```

The dev node prints a faucet address + a list of pre-funded accounts (each
with `1_000_000` CFX by default) you can paste into MetaMask / Fluent.

See [`@cfxdevkit/devnode`](../../../../repos/cfx-core/packages/devnode/README.md)
for the full lifecycle API.
