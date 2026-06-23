---
name: gitnexus
description: Code intelligence for the framework project. Use for impact analysis, codebase exploration, bug tracing, refactoring, and changeset validation. Read this skill when the user asks about code structure, blast radius, how to use GitNexus tools, or needs to understand execution flows.
---

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **framework** (9599 symbols, 20712 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "dev"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Workflow

### Exploring Code (How does X work?)

```
1. READ gitnexus://repo/framework/context  → Codebase overview
2. query({query: "concept"})              → Find execution flows
3. context({name: "symbol"})              → Deep dive on specific symbol
4. READ gitnexus://repo/framework/process/{name} → Full trace
```

### Impact Analysis (What breaks if I change X?)

```
1. impact({target: "X", direction: "upstream"})  → Dependents
2. Review d=1 items first (these WILL BREAK)
3. READ processes to check affected execution flows
4. detect_changes() for pre-commit check
5. Assess risk and report to user
```

### Bug Tracing (Why is X failing?)

```
1. context({name: "failingFunction"})            → Find callers
2. READ gitnexus://repo/framework/process/{name} → Trace flow
3. query({query: "error scenario"})              → Related flows
4. Read source files for implementation details
```

### Refactoring (Rename / Extract / Split)

```
1. impact({target: "symbol", direction: "upstream"})
2. Use `rename` (not find-and-replace) — it understands the call graph
3. verify with detect_changes() after rename
```

## Understanding Impact Output

| Depth | Risk Level       | Meaning                  |
| ----- | ---------------- | ------------------------ |
| d=1   | **WILL BREAK**   | Direct callers/importers |
| d=2   | LIKELY AFFECTED  | Indirect dependencies    |
| d=3   | MAY NEED TESTING | Transitive effects       |

## Risk Assessment

| Affected                       | Risk     |
| ------------------------------ | -------- |
| <5 symbols, few processes      | LOW      |
| 5-15 symbols, 2-5 processes    | MEDIUM   |
| >15 symbols or many processes  | HIGH     |
| Critical path (auth, payments) | CRITICAL |

## Tools Reference

| Tool             | What it gives you                                                        |
| ---------------- | ------------------------------------------------------------------------ |
| `query`          | Process-grouped code intelligence — execution flows related to a concept |
| `context`        | 360-degree symbol view — categorized refs, processes it participates in  |
| `impact`         | Symbol blast radius — what breaks at depth 1/2/3 with confidence         |
| `detect_changes` | Git-diff impact — what do your current changes affect                    |
| `rename`         | Multi-file coordinated rename with confidence-tagged edits               |
| `fetch_content`  | Full page content from URLs (GitHub, YouTube, web pages)                 |
| `web_search`     | Web search with provider fallback (Exa → Perplexity → Gemini)            |

## Resources Reference

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/framework/context` | Codebase overview, check index freshness |
| `gitnexus://repo/framework/clusters` | All functional areas |
| `gitnexus://repo/framework/processes` | All execution flows |
| `gitnexus://repo/framework/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
