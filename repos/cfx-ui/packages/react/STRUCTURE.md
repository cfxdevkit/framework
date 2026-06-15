```text
.gitignore
API.md
CHANGELOG.md
README.md
STRUCTURE.md
moon.yml
package.json
src
  account.ts — Account-related hooks (e.g., current account)
  balance.ts — Balance querying hooks
  context.tsx — Core React context provider for CDK integration
  contract.ts — Contract interaction hooks
  events.ts — Event subscription hooks
  index.test.ts — Root-level unit tests
  index.ts — Main entry point re-exporting public hooks
  keystore
    context.tsx — Keystore context provider
    index.ts — Keystore module entry point
    keystore-mutations.test.tsx — Keystore mutation tests
    keystore.test.tsx — Keystore core tests
    types.ts — Shared keystore types
    use-keystore
      accounts.ts — Account management hooks
      identity.ts — Identity-related hooks
      lifecycle.ts — Keystore lifecycle hooks
      mutations.ts — Keystore state mutation helpers
      wallets.ts — Wallet management hooks
    wallet
      shell.test.tsx — Wallet shell component tests
      shell.tsx — Wallet shell UI component
      switchers.test.tsx — Wallet switcher tests
  tx.ts — Transaction hooks (signing, sending, status)
tsconfig.json — TypeScript configuration
vite.config.ts — Vite build config (for dev/preview)
vitest.config.ts — Vitest test config
```

<!-- structure-status: enriched -->
<!-- structure-hash: d35eb4136608d09b54e4e2394c0f82b87acc375484918ceb51e25c6efd5df1c9 -->
