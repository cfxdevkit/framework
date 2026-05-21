## ADDED Requirements

### Requirement: arch-rules.yaml is the authoritative source for tier definitions
`repos/cfx-meta/arch-rules.yaml` SHALL be the single machine-readable source of truth for the monorepo tier model. `ARCHITECTURE.md` SHALL reference this file as authoritative and SHALL NOT contradict it.

#### Scenario: File exists with valid schema
- **WHEN** `repos/cfx-meta/arch-rules.yaml` is read
- **THEN** it contains a `version` field, a `lifecycle` field, a `cross-cutting` section, and a `tiers` array with at least four entries (framework, platform, domains, projects)

#### Scenario: Tier level ordering is monotonic
- **WHEN** the `tiers` array is read
- **THEN** each tier entry has a unique integer `level` and the levels increase from framework (0) to projects (3) with no gaps or duplicates

#### Scenario: Cross-cutting section is defined
- **WHEN** the `cross-cutting` section is read
- **THEN** it lists path globs covering `repos/cfx-meta/packages/**` and `repos/cfx-config/packages/**`

#### Scenario: Rule entries have required fields
- **WHEN** any entry in the `rules` array is read
- **THEN** it contains an `id` (unique string), `enforce` (one of `always` | `on-release`), `severity` (one of `error` | `warning`), `scope` (one of `all` or a list of tier IDs), and `description`

#### Scenario: Lifecycle controls on-release rule enforcement
- **WHEN** `lifecycle: pre-release` is set
- **THEN** rules with `enforce: on-release` SHALL emit warnings only, never errors
- **WHEN** `lifecycle: release` is set
- **THEN** rules with `enforce: on-release` SHALL emit errors identical to `enforce: always` rules

---

### Requirement: @cfxdevkit/arch-rules package exports typed tier helpers
The `@cfxdevkit/arch-rules` package at `repos/cfx-meta/packages/arch-rules/` SHALL export a typed API derived from `arch-rules.yaml`. It SHALL be importable as a workspace devDependency by any other package.

#### Scenario: getTierFor resolves a workspace-relative path to a tier
- **WHEN** `getTierFor('repos/cfx-core/packages/cdk/src/index.ts')` is called
- **THEN** it returns `{ id: 'framework', level: 0 }`

#### Scenario: getTierFor returns cross-cutting for cfx-meta and cfx-config paths
- **WHEN** `getTierFor('repos/cfx-meta/packages/arch-rules/src/index.ts')` is called
- **THEN** it returns `{ id: 'cross-cutting', level: -1, crossCutting: true }`
- **WHEN** `getTierFor('repos/cfx-config/packages/tsconfig/base.json')` is called
- **THEN** it returns `{ id: 'cross-cutting', level: -1, crossCutting: true }`

#### Scenario: getTierFor returns null for unrecognized paths
- **WHEN** `getTierFor('some/unknown/path')` is called
- **THEN** it returns `null`

#### Scenario: getRulesFor returns rules applicable to a tier
- **WHEN** `getRulesFor('framework')` is called
- **THEN** it returns all rules whose `scope` is `all` or includes `framework`

#### Scenario: getLifecycle returns the current lifecycle value
- **WHEN** `getLifecycle()` is called
- **THEN** it returns the string value of the `lifecycle` field in `arch-rules.yaml`

#### Scenario: Package has correct exports map
- **WHEN** the `package.json` of `@cfxdevkit/arch-rules` is read
- **THEN** it contains an `exports` field with a `.` entry mapping to `./dist/index.js` (import) and `./dist/index.d.ts` (types)

#### Scenario: Package is private and has no runtime dependencies
- **WHEN** the `package.json` of `@cfxdevkit/arch-rules` is read
- **THEN** `private` is `true` and `dependencies` is empty or absent

---

### Requirement: arch-rules package is registered in workspace and moon
`@cfxdevkit/arch-rules` SHALL be a first-class workspace member, buildable and checkable via moon.

#### Scenario: Package is listed in pnpm-workspace.yaml
- **WHEN** `pnpm-workspace.yaml` is read
- **THEN** it contains a pattern matching `repos/cfx-meta/packages/*`

#### Scenario: Package is listed in .moon/workspace.yml
- **WHEN** `.moon/workspace.yml` is read
- **THEN** it contains an entry for `repos/cfx-meta/packages/arch-rules`

#### Scenario: moon build task succeeds
- **WHEN** `moon run arch-rules:build` is executed
- **THEN** it exits with code 0 and `repos/cfx-meta/packages/arch-rules/dist/` contains `index.js` and `index.d.ts`
