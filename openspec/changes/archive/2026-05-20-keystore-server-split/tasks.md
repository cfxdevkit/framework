## 1. Scaffold @cfxdevkit/keystore-server package

- [ ] 1.1 Create `repos/cfx-tools/packages/keystore-server/` directory with `package.json` (`@cfxdevkit/keystore-server`, private: false, deps: `@cfxdevkit/core`, `@cfxdevkit/services`, `@cfxdevkit/wallet`, `hono`)
- [ ] 1.2 Create `repos/cfx-tools/packages/keystore-server/tsconfig.json` extending the workspace tsconfig
- [ ] 1.3 Create `repos/cfx-tools/packages/keystore-server/vite.config.ts` mirroring devnode-server's lib build config

## 2. Move keystore source files from devnode-server

- [ ] 2.1 `git mv repos/cfx-tools/packages/devnode-server/src/keystore.ts repos/cfx-tools/packages/keystore-server/src/keystore.ts`
- [ ] 2.2 `git mv repos/cfx-tools/packages/devnode-server/src/keystore/ repos/cfx-tools/packages/keystore-server/src/keystore/`
- [ ] 2.3 `git mv repos/cfx-tools/packages/devnode-server/src/routes/keystore.ts repos/cfx-tools/packages/keystore-server/src/routes/keystore.ts`

## 3. Create keystore-server app and index

- [ ] 3.1 Create `repos/cfx-tools/packages/keystore-server/src/app.ts` — `createKeystoreApp(config)` function that builds a Hono app and mounts the keystore router
- [ ] 3.2 Create `repos/cfx-tools/packages/keystore-server/src/index.ts` — re-exports `createKeystoreApp`, `createKeystoreRouter`, `KeystoreService`, and relevant types

## 4. Refactor devnode-server to use keystore-server

- [ ] 4.1 Add `"@cfxdevkit/keystore-server": "workspace:^"` to `repos/cfx-tools/packages/devnode-server/package.json` dependencies
- [ ] 4.2 Update `repos/cfx-tools/packages/devnode-server/src/app.ts` — replace inline keystore route registration with `createKeystoreRouter` import from `@cfxdevkit/keystore-server`
- [ ] 4.3 Remove now-empty keystore source file references from devnode-server (any remaining imports, re-exports)

## 5. Register in workspace configuration

- [ ] 5.1 Add `'repos/cfx-tools/packages/keystore-server'` to `.moon/workspace.yml` projects list
- [ ] 5.2 Add `repos/cfx-tools/packages/keystore-server` path entry to the `platform` tier in `repos/cfx-meta/arch-rules.yaml`
- [ ] 5.3 Run `pnpm install` to link the new workspace package

## 6. Build and verify

- [ ] 6.1 Run `pnpm --filter @cfxdevkit/keystore-server build`
- [ ] 6.2 Run `pnpm --filter @cfxdevkit/devnode-server build`
- [ ] 6.3 Run `pnpm -w typecheck`
- [ ] 6.4 Run `pnpm -w test`
