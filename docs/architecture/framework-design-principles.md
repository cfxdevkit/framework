# Framework Design Principles

> Applies to every package under `framework/`. Domains and projects SHOULD follow it too.
> The goal: components small enough that one AI agent or one human can hold the whole module in their head.

---

## 1. Linear flow, no hidden state

- **Pure functions by default.** A function takes inputs and returns outputs. No
  reading from process globals, no module-scope mutable state.
- **Side effects are named.** A function with side effects is named with a verb of
  intent: `writeContract`, `startNode`, `unlockKeystore`. Pure derivations use noun
  phrases: `formatAmount`, `parseAddress`.
- **No "manager" / "context" / "service" god objects** that hide flow inside
  methods. If a unit needs five collaborators, those five are passed as arguments.
- **No singletons.** All state is created by an explicit factory and passed
  through. Tests can construct a fresh world per case.

## 2. One responsibility per module

- A module (= one `.ts` file) exports **one primary concept**. Helpers private to
  that concept stay in the same file. Helpers used by ≥ 2 concepts move to a sibling
  `internal/` folder.
- A folder under `src/` corresponds to **one feature**. Inside, the public surface is
  one or two named exports re-exported from `index.ts`.
- If a file mixes two concerns (e.g., parsing AND validating), split it.

## 3. Component-size budget

| Unit | Soft limit | Hard limit |
|------|-----------|-----------|
| File | 250 LOC | 300 LOC |
| Function | 30 LOC | 60 LOC |
| Public exports per module | 5 | 10 |
| Public methods on a class | 4 | 7 |
| Function arguments | 3 positional, then options-object | — |
| Cyclomatic complexity per function | 6 | 10 |

A module that approaches the hard limit must be split before merge. Enforced via a
Biome rule shipped in `tools/biome-config/`.

## 4. Prefer functions over classes

- **Use a class only when:** identity matters (long-lived connection, queue, store)
  or the type is explicitly an instance returned by a factory (`createX(): X`).
- **No inheritance** beyond `extends Error`. Composition only.
- A "configured function" is a closure returned by a factory (`createReader(opts) → read(args)`),
  not a class with one method.

## 5. Plain data in, plain data out

- Inputs and outputs are **plain JSON-serialisable objects** wherever possible.
  Branded types are fine; classes as values are not.
- No "rich" objects with methods returning more rich objects. Methods describe
  actions, not derivations. Derivations are free functions.
- `Date` is allowed; `BigInt` is required for token amounts and balances.

## 6. Explicit dependency injection

- Anything that touches the network, the filesystem, the clock, or randomness is
  **passed in**, not imported at module top.
- Each package exports defaults under `<pkg>/defaults` so consumers can opt in.
- This makes every module trivially mockable (no msw / no module mocking).

```
// shape, not code:
createOrderService({ client, signer, clock, logger }): OrderService
```

## 7. Error model

- Every package defines its errors in `src/errors/`. They extend a single root
  `CfxError` from `framework/core/errors`.
- Errors carry **structured `code`** (string enum) and **`cause`** (Error). No
  string-based pattern matching by callers.
- Public functions document the **set of errors** they may throw. If unexpected,
  wrap-and-rethrow with `cause`.
- `try/catch` blocks always do something; never empty catches.

## 8. Async model

- Public async functions return `Promise<T>`. No callbacks, no event emitters in
  the public surface (event-stream APIs use `AsyncIterable` instead).
- **Cancellation** is via `AbortSignal`. Every long-running public function takes
  `{ signal?: AbortSignal }` in its options.
- **Timeouts** are caller's responsibility (`AbortSignal.timeout`). Libraries do
  not invent their own timeout config.

## 9. Naming

- `create*` — factory returning a configured instance/closure.
- `make*` — pure constructor of a value.
- `read*` / `write*` — chain reads / writes.
- `parse*` / `format*` — pure (de)serialisation.
- `is*` / `has*` / `can*` — type predicates / capability checks.
- `assert*` — throws if invariant violated.

## 10. Public surface

- **Named exports only.** No default exports.
- The package `exports` map declares every importable sub-path. Anything not listed
  is private and may break without semver bump.
- Each sub-path resolves to `dist/<sub>/index.js` and `dist/<sub>/index.d.ts`. No
  deep-import escape hatches.

## 11. Documentation as contract

- Every public function carries TSDoc with: one-line summary, `@param`, `@returns`,
  `@throws`, and a runnable `@example`.
- TSDoc is the source for the generated API reference at
  `docs/api/<package>/`.
- The `API.md` next to each package's `STRUCTURE.md` enumerates the **stable public
  surface**. If it's not in `API.md`, it isn't public.

## 12. Tests

- Co-located unit tests (`*.test.ts`). One test file per source file.
- Each public function has at least: happy path, one error path, one edge case.
- Integration tests under `test/integration/` use `framework/testing` fixtures only;
  no project-specific mocks leak in.
- No snapshot tests for chain data (always fragile); use explicit assertions.

## 13. Stability tiers (semver inside framework)

Every public symbol is annotated with its stability:

- `@stable` — semver-protected. Removal/breakage requires a major bump.
- `@beta` — public, may change in a minor; documented in changelog.
- `@experimental` — public for feedback, may break in a patch.
- `@internal` — not public. Lives behind `internal/` and is never re-exported.

The doc generator surfaces stability in the API reference.

## 14. What to AVOID

- ❌ "Helpers" files (`utils.ts`, `helpers.ts`, `misc.ts`). Name the concept.
- ❌ Re-exporting everything from `index.ts` ("barrel of barrels"). Re-export
  intentionally; the index is a curated public surface.
- ❌ Conditional imports based on runtime detection. Split into separate entrypoints
  (`./node`, `./browser`) only when truly necessary (e.g., Node.js vs browser APIs).
- ❌ Implicit dependencies on `process.env`. Read env at the app boundary; pass
  values into framework functions.
- ❌ "Smart" overloading. Two functions are clearer than one with five overloads.
- ❌ Returning `T | undefined | null` ambiguously. Pick one. Prefer `T | null` for
  "intentionally absent"; `undefined` only for "key not present".

---

## Refactor checklist (per package)

When applying this document to a package:

- [ ] Public surface listed in `API.md`, every entry annotated with stability.
- [ ] `src/errors/` exists; one error type per failure mode; all extend `CfxError`.
- [ ] No file > 300 LOC; no function > 60 LOC.
- [ ] No module-scope mutable state.
- [ ] Every async public function accepts `{ signal? }`.
- [ ] Every external dep (network, fs, clock, rand) injectable.
- [ ] `package.json` `exports` map matches `API.md` sub-paths.
- [ ] No imports from upper tiers.
- [ ] No imports from `internal/` of another package.
- [ ] Co-located `*.test.ts` for every source file.
- [ ] TSDoc with `@example` on every `@stable` symbol.
