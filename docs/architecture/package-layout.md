# Standard Package Layout

Every TypeScript package in `framework/`, `platform/`, `domains/`, and project-internal
`packages/` directories follows this layout. Deviations must be justified in the package's README.

```
<package>/
├── README.md                Scope, public API, dependencies, examples
├── CHANGELOG.md             Changesets-managed (framework/* only)
├── package.json             Name, exports map, peer deps, scripts
├── tsconfig.json            Extends @cfxdevkit/tsconfig/<flavor>.json
├── vite.config.ts           Library mode build (framework/, domains/) or app build (apps)
├── moon.yml                 Task definitions (build, test, typecheck, lint)
├── src/
│   ├── index.ts             Public entrypoint (re-exports only)
│   ├── <feature>/           One folder per feature/concern
│   │   ├── index.ts         Feature barrel
│   │   ├── <feature>.ts     Implementation
│   │   └── <feature>.test.ts Co-located unit test
│   └── internal/            Private helpers (not re-exported)
├── test/
│   ├── fixtures/            Shared test data
│   └── integration/         Multi-module integration tests
├── docs/
│   ├── api.md               Generated API reference (TypeDoc)
│   └── examples/            Runnable examples (consumed by docs site)
└── dist/                    Build output (gitignored)
```

### Conventions

- **One concept per `src/<feature>/` folder.** Related files (impl, types, tests, docs)
  live together.
- **`src/index.ts` re-exports only.** No logic in the entrypoint.
- **Tests are co-located** (`<file>.test.ts`) for unit tests; cross-module tests go under `test/`.
- **No default exports** in published packages — named exports keep tree-shaking predictable.
- **`exports` map in `package.json`** declares every public sub-path; nothing else is importable.

### Rationale

Co-location keeps cognitive load low: opening one folder shows the implementation, types,
tests, and docs of a feature together. Strict `exports` maps prevent consumers from reaching
into internals.
