# `@cfxdevkit/example-showcase-browser`

Browser-only showcase of **external user wallets** on Conflux. Every signing or
broadcasting flow goes through a wallet the user controls. Fluent Core is wired
directly through `window.conflux`; wagmi/eSpace is restricted to non-Fluent
EIP-1193 providers such as MetaMask, Rabby, OKX, or Brave.

There is **no mnemonic stand-in**, **no in-browser keystore**, and **no
backend signer** in this app. Those concerns live in the sister apps:

- `@cfxdevkit/example-showcase-backend` — Node-side flows (devnode, compiler,
  SIWE issuer, session keys).
- `@cfxdevkit/example-showcase` — original mixed showcase.
- *(forthcoming)* — combined user-wallet-↔-backend showcase.

## Stacks demonstrated

| Stack                          | Used for                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| `wagmi` + `viem` + react-query | eSpace EIP-1193, excluding Fluent                                 |
| Direct Core connector          | Fluent Core via `window.conflux`, `cfx_*`, base32 addresses       |
| `@cfxjs/use-wallet-react`      | Raw diagnostic panels for dedicated eSpace providers              |
| Raw `window` polling           | Diagnose injected-provider detection                              |
| `@cfxdevkit/core`              | base32 ↔ hex codec, drip math, public-chain catalogue + ping      |

## Panels

**Connect** — Raw providers · wagmi (non-Fluent injected) · Core/Fluent · diagnostic provider panels
**Use** — Account summary · Sign message (personal_sign + EIP-712) · Send tx
**Utility** — Address & units · Network status · About

## Run

```bash
pnpm showcase
# -> http://127.0.0.1:5173/browser/

pnpm --filter @cfxdevkit/example-showcase-browser dev
# -> http://127.0.0.1:5176

pnpm exec moon run showcase-browser:check
```

UI/UX patterns adapted from `devkit-workspace/templates/wallet-probe` and
`devkit-workspace/packages/ui-shared`.
