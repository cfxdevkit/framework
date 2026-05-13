## 1. Create repos/cfx-config repo structure

- [x] 1.1 Create `repos/cfx-config/` directory with `README.md`, `CHANGELOG.md`, `package.json`, and `pnpm-workspace.template.yaml` following the same shape as other `repos/cfx-*` root files
- [x] 1.2 Create `repos/cfx-config/packages/` directory
- [x] 1.3 Copy `tools/tsconfig/` → `repos/cfx-config/packages/tsconfig/` (preserve all files: `package.json`, `base.json`, `lib.json`, `app-web.json`, `README.md`, `CHANGELOG.md`, `moon.yml`, `API.md`)
- [x] 1.4 Copy `tools/biome-config/` → `repos/cfx-config/packages/biome-config/` (preserve all files including `biome.json`, `rules/`, `README.md`, `CHANGELOG.md`, `moon.yml`, `API.md`)
- [x] 1.5 Copy `tools/moon-config/` → `repos/cfx-config/packages/moon-config/` (preserve all files including `templates/`, `README.md`, `CHANGELOG.md`, `moon.yml`, `API.md`)
- [x] 1.6 Verify all three `package.json` files under `repos/cfx-config/packages/` retain their original package names and `"private": true`

## 2. Wire cfx-config into workspace

- [x] 2.1 Add `repos/cfx-config/packages/*` to `pnpm-workspace.yaml` packages list
- [x] 2.2 Replace the three `tools/tsconfig`, `tools/biome-config`, `tools/moon-config` entries in `.moon/workspace.yml` with `repos/cfx-config/packages/tsconfig`, `repos/cfx-config/packages/biome-config`, `repos/cfx-config/packages/moon-config`
- [x] 2.3 Run `pnpm install` and verify the lockfile updates cleanly with no resolution errors

## 3. Update all tsconfig.json extends paths

- [x] 3.1 Search workspace for all `tsconfig.json` files containing `extends` paths that reference `tools/tsconfig/` and update them to the new relative path pointing to `repos/cfx-config/packages/tsconfig/`
- [x] 3.2 Search workspace for all `biome.json` files (including root `biome.json`) that reference `tools/biome-config/` and update extends paths
- [x] 3.3 Search workspace for all `moon.yml` files that reference `tools/moon-config/` template paths and update them
- [x] 3.4 Run `pnpm run typecheck` at workspace root and confirm exit code 0
- [x] 3.5 Run `pnpm run lint` at workspace root and confirm exit code 0

## 4. Create repos/cfx-meta/packages/arch-rules package

- [x] 4.1 Create `repos/cfx-meta/packages/` directory
- [x] 4.2 Create `repos/cfx-meta/packages/arch-rules/package.json` with name `@cfxdevkit/arch-rules`, `"private": true`, proper `exports` map (`./dist/index.js` + `./dist/index.d.ts`), and devDependencies for `@cfxdevkit/tsconfig`, `@cfxdevkit/biome-config`, `typescript`, `vite`, `vite-plugin-dts`
- [x] 4.3 Create `repos/cfx-meta/packages/arch-rules/tsconfig.json` extending `@cfxdevkit/tsconfig/lib.json`
- [x] 4.4 Create `repos/cfx-meta/packages/arch-rules/vite.config.ts` in library mode
- [x] 4.5 Create `repos/cfx-meta/packages/arch-rules/moon.yml` with `build`, `typecheck`, `lint` tasks
- [x] 4.6 Create `repos/cfx-meta/packages/arch-rules/src/types.ts` with TypeScript interfaces: `TierDef`, `CrossCuttingDef`, `ArchRule`, `ArchRulesSchema`
- [x] 4.7 Create `repos/cfx-meta/packages/arch-rules/src/index.ts` that imports and parses `arch-rules.yaml` (via `?raw` Vite import or bundled JSON) and exports `getTierFor(path: string)`, `getRulesFor(tierId: string)`, `getLifecycle()`, `rules` (readonly array), `tiers` (readonly array)
- [x] 4.8 Create `repos/cfx-meta/packages/arch-rules/README.md`

## 5. Create repos/cfx-meta/arch-rules.yaml

- [x] 5.1 Create `repos/cfx-meta/arch-rules.yaml` with `version: 1`, `lifecycle: pre-release`, `cross-cutting` section (paths for cfx-meta and cfx-config), and `tiers` array (framework level 0, platform level 1, domains level 2, projects level 3)
- [x] 5.2 Add `rules` array entries covering: `no-upward-imports` (always/error), `no-internal-reach` (always/error), `no-default-exports` (always/error, scope: framework+domains), `framework-requires-exports-map` (on-release/warning), `platform-uses-semver-for-framework` (on-release/warning), `requires-moon-yml` (always/error), `requires-src-index` (always/error, scope: framework+domains), `requires-readme` (always/warning), `requires-changelog` (on-release/warning, scope: framework), `file-size-hard-limit` (always/error, params.max_lines: 300), `no-ts-nocheck` (always/error), `no-js-mjs-source-files` (always/error)
- [x] 5.3 Verify `@cfxdevkit/arch-rules` builds successfully (`moon run arch-rules:build`) and the exported `getTierFor` / `getRulesFor` functions return correct values for known paths

## 6. Wire cfx-meta into workspace

- [x] 6.1 Add `repos/cfx-meta/packages/*` to `pnpm-workspace.yaml`
- [x] 6.2 Add `repos/cfx-meta/packages/arch-rules` to `.moon/workspace.yml`
- [x] 6.3 Run `pnpm install` and confirm no errors

## 7. Remove tools/ from repo root

- [x] 7.1 Delete `tools/tsconfig/`, `tools/biome-config/`, `tools/moon-config/` directories (now migrated)
- [x] 7.2 Delete `tools/codegen/` directory (stubs only; live code is in cfx-solidity)
- [x] 7.3 Delete `tools/CHANGELOG.md`, `tools/README.md`, `tools/STRUCTURE.md`
- [x] 7.4 Remove `tools/*` pattern from `pnpm-workspace.yaml`
- [x] 7.5 Verify no remaining references to `tools/` in workspace config files (`grep -r "tools/" .moon/ pnpm-workspace.yaml`)

## 8. Update ARCHITECTURE.md

- [x] 8.1 Add a "Cross-cutting repos" section documenting `repos/cfx-meta` (architecture artifacts) and `repos/cfx-config` (build configuration) with `level: -1` and the devDependency-only rule
- [x] 8.2 Update the tier table to include the cross-cutting row
- [x] 8.3 Add a note at the top of the Architecture section directing editors to `repos/cfx-meta/arch-rules.yaml` as the machine-readable authoritative source

## 9. Final verification

- [x] 9.1 Run `pnpm run build` at workspace root and confirm exit code 0
- [x] 9.2 Run `pnpm run typecheck` at workspace root and confirm exit code 0
- [x] 9.3 Run `pnpm run lint` at workspace root and confirm exit code 0
- [x] 9.4 Run `pnpm run test` at workspace root and confirm exit code 0
- [x] 9.5 Confirm `tools/` directory no longer exists at repo root
- [x] 9.6 Confirm `repos/cfx-config/packages/` contains exactly three packages
- [x] 9.7 Confirm `repos/cfx-meta/packages/arch-rules/dist/` contains `index.js` and `index.d.ts`
