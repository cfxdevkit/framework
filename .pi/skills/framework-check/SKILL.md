---
name: framework-check
description: Changeset validation, code quality gates, and policy verification for the framework project. Use when the user asks to check a change, verify readiness, or validate commits.
---

# Framework Check — Validation & Quality Gates

## Pre-Commit Checklist

Before committing or merging changes:

```
1. detect_changes()                              → What did you change?
2. Review affected symbols and execution flows
3. pnpm check:hotspots                           → Find code quality issues
4. Verify affected tests pass
5. Check lint and typecheck
```

### Always Do Before Committing

- **MUST run `detect_changes()`** to verify your changes only affect expected symbols and execution flows.
- For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "dev"})`.
- **MUST run `pnpm check`** to ensure nothing broke.

## Code Quality Gates

| Gate | Command | What it checks |
|------|---------|----------------|
| Hotspots | `pnpm check:hotspots` | Code complexity, cyclomatic complexity, cognitive complexity |
| Lint | `pnpm lint` | ESLint/Prettier rules |
| Typecheck | `pnpm typecheck` | TypeScript compilation |
| Tests | `pnpm test` | Unit + integration tests |

## Policy Gates

| Policy | Check |
|--------|-------|
| Commit messages | Follow conventional commits (`feat:`, `fix:`, `chore:`, etc.) |
| Branch rules | Feature branches must be based on latest `main` or `dev` |
| PR requirements | All CI checks pass, at least one review, linked issue |
| OpenSpec changes | Must have all artifacts complete (`proposal`, `design`, `specs`, `tasks`) |

## Post-Commit Verification

```
1. detect_changes()                               → Confirm changeset is clean
2. pnpm check:hotspots                            → No new hotspots
3. pnpm --filter <affected-package> test          → Tests pass
4. pnpm lint --fix                                → Lint clean
```

## Impact Assessment

After running `detect_changes()`:

| Result | Action |
|--------|--------|
| 0 affected symbols | Safe to commit |
| <5 affected symbols, no critical flows | Low risk, commit |
| 5-15 affected symbols | Review affected flows, run tests |
| >15 affected symbols or critical paths | HIGH risk — review with team, run full test suite |
| Unintended affected flows | Reconsider changes before committing |
