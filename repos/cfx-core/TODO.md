# cfx-core TODO

## Structure Improvements

### 2. Tree-Shaking Optimization
**Priority:** Medium  
**Status:** Partially done (2026-05-19)

#### Remaining
- **Export optimization:** All subpath exports already have `types` + `import` conditions. `require` (CJS) condition and `default` fallback not yet added — add when CJS consumers are needed.
- **Bundle size verification:** No `size-limit` or bundle analyser CI check yet. Add when publishing cadence is established.

### 3. Build Output Cleanup
**Priority:** Medium  
**Status:** Done (2026-05-19)

#### Remaining
- CI clean-build verification (remove dist, reinstall, rebuild) not yet added to pipeline.

### 4. TypeScript Configuration
**Priority:** Medium  
**Status:** Partially done (2026-05-19)

#### Remaining
- Type completeness verification script (check all public exports have explicit types) not yet added.
- `emitDeclarationOnly` verification (current config uses `noEmit: true`; Vite's `vite-plugin-dts` handles `.d.ts` emission).

### 5. Documentation Improvements
**Priority:** Low  
**Status:** Pending

- Expand `executor` README (currently 374 bytes)
- Add PORTING.md to packages that lack it
- Expand `protocol` STRUCTURE.md (currently 829 bytes)

## arch-check Analysis

### Improvements Needed

#### 2. Exclude Generated Files from Size Limits
**Priority:** High  
**Status:** Done (2026-05-19)

The `file-size-hard-limit` rule currently catches generated files like `mainnet-catalog.generated.ts`.

**Fix:** Update `arch.ts` to exclude generated files:
```typescript
// Already excluded in collectPackageSourceFiles but rule check bypasses this
// Need to apply same exclusion logic in checkSourceFiles
```

#### 3. Add Test Coverage
**Priority:** Medium  
**Status:** Partially done (2026-05-19)

No test files exist for arch-check. Add tests for:
- `runtime.ts` utility functions
- Individual check implementations
- Rule enforcement logic
- Report generation

#### 5. Enhance Hotspots Reporting
**Priority:** Medium  
**Status:** Partially done (2026-05-19)

##### 5a. Visual reports (Mermaid + HTML)
**Status:** Done (2026-05-19) — Mermaid implemented

The current `renderMarkdownReport` in `hotspots.ts` produces plain bullet-list output. The goal is to emit a richer report that renders charts without external runtime dependencies.

**Approach A — Mermaid bar chart in markdown (simplest, renders on GitHub)**

Append a `xychart-beta` Mermaid block after the Top Hotspots table in `code-hotspots.md`. GitHub and the VS Code Markdown preview both render Mermaid natively.

```typescript
// In renderMarkdownReport(), after the top-hotspots list:
function renderMermaidHotspotChart(records: readonly HotspotRecord[]): string {
  const top = records.slice(0, 10);
  // Mermaid xychart-beta labels must be short — use basename only
  const labels = top.map((r) => `"${r.path.split('/').at(-1) ?? r.path}"`);
  const scores = top.map((r) => r.hotspotScore);
  return [
    '```mermaid',
    'xychart-beta horizontal',
    '    title "Top 10 Hotspot Scores"',
    `    x-axis [${labels.join(', ')}]`,
    `    y-axis "Score"`,
    `    bar [${scores.join(', ')}]`,
    '```',
  ].join('\n');
}
```

Add a second chart for line counts:
```typescript
function renderMermaidLinecountChart(records: readonly HotspotRecord[]): string {
  // same shape, y-axis is `lines` not `hotspotScore`
}
```

Output written alongside existing markdown: `artifacts/llm/reports/code-hotspots.md` (in-place extension of `renderMarkdownReport`).

**Approach B — Self-contained HTML report with inline SVG**

Write a second artifact `artifacts/llm/reports/code-hotspots.html` using only Node.js built-ins. SVG is built by string template — no `canvas`, no `d3`, no external deps.

Key function to add in `hotspots.ts`:

```typescript
function renderHtmlReport(report: HotspotReport): string {
  const top = report.hotspots.slice(0, 15);
  const maxScore = Math.max(...top.map((r) => r.hotspotScore), 1);
  const barHeight = 24;
  const chartWidth = 600;
  const rows = top.map((r, i) => {
    const barW = Math.round((r.hotspotScore / maxScore) * chartWidth);
    const y = i * (barHeight + 4);
    const color = r.overHardLimit ? '#e05252' : r.overSoftLimit ? '#e09e52' : '#5299e0';
    const label = r.path.split('/').slice(-2).join('/');
    return [
      `<rect x="0" y="${y}" width="${barW}" height="${barHeight}" fill="${color}" rx="3"/>`,
      `<text x="${barW + 6}" y="${y + 16}" font-size="11" fill="#ccc">${label} (${r.hotspotScore})</text>`,
    ].join('');
  });
  const svgHeight = top.length * (barHeight + 4);
  // wrap in minimal HTML with dark background
  return `<!DOCTYPE html>...`;
}
```

Call `renderHtmlReport` inside `writeReports()` and write to `code-hotspots.html`.

**Files to change:**
- `src/checks/hotspots.ts` — add `renderMermaidHotspotChart`, `renderMermaidLinecountChart`, `renderHtmlReport`; update `writeReports` to call them; update `renderMarkdownReport` to append mermaid blocks
- `moon.yml` — add `code-hotspots.html` to `outputs` of `check-hotspots`

##### 5b. Trend tracking

The current report is stateless — each run overwrites the previous JSON. To track trends, persist a time-series file.

**Design:**
- After each run, append a summary row to `artifacts/llm/reports/hotspot-history.jsonl`:
  ```json
  {"at":"2026-05-19T10:00:00Z","scanned":312,"hardViolations":0,"softWarnings":37,"topScore":9694,"topPath":"..."}
  ```
- In `renderMarkdownReport`, if `hotspot-history.jsonl` has ≥2 rows, emit a `Δ` delta line at the top: `Soft warnings: 37 (Δ+2 vs previous run)`.
- Use `readJsonIfExists` / `writeJsonl` helpers from `runtime.ts` — no new dependencies.

**Files to change:**
- `src/checks/hotspots.ts` — read existing history, append row, compute delta for report header
- `moon.yml` — add `hotspot-history.jsonl` to `outputs`

##### 5c. Per-package budgets

Allow individual packages to declare their own soft/hard line limits via a `hotspot` key in `package.json` or `moon.yml`. Packages with a large intentional file (e.g., a Solidity ABI) can raise their budget without raising the global limit.

**Design:**
```json
// package.json
{
  "hotspot": { "softLimit": 400, "hardLimit": 500 }
}
```
In `buildHotspotReport`, after reading each file's line count, look up the package budget by calling `packageOwner(rel)` and checking a pre-loaded budget map. Override `overSoftLimit` / `overHardLimit` for that file.

**Files to change:**
- `src/checks/hotspots.ts` — load package budgets, apply per-file override

#### 6. Fix Documentation References
**Priority:** Medium  
**Status:** Pending

Update documentation to fix broken references identified by `check-docs`:
- Remove/update `cfx-openhands` references
- Create missing `docs/architecture/` files or update references
- Fix package-level documentation paths

#### 8. Expand Corpus Collection
**Priority:** Low  
**Status:** Pending

The corpus pipeline in `src/checks/corpus.ts` and the shared `textExtensions` / `languageForPath` helpers in `src/runtime.ts` currently have no support for `.graphql` or `.proto` files. All changes are confined to those two files.

##### 8a. Add `.graphql` support

**`src/runtime.ts`:**
1. Add `'.graphql'` to `textExtensions`.
2. Map `'.graphql': 'graphql'` in `languageForPath`.

**`src/checks/corpus.ts`:**
Add a `extractGraphqlIndex` function that extracts top-level named definitions for `docs-index.jsonl`, similar to the `extractDocIndex` heading extractor:
```typescript
const graphqlDefinitionPattern =
  /^(?:type|interface|enum|union|input|scalar|directive|query|mutation|subscription)\s+(\w+)/gm;

function extractGraphqlIndex(path: string, content: string) {
  const records = [];
  for (const match of content.matchAll(graphqlDefinitionPattern)) {
    records.push({
      path,
      depth: 1,
      heading: match[1] ?? '',  // definition name
      package: packageOwner(path),
      tier: tierForPath(path),
    });
  }
  return records;
}
```
In `runCorpusCheck`, after the existing `if (docExtensions.has(...))` call, add:
```typescript
if (extname(rel) === '.graphql') docRecords.push(...extractGraphqlIndex(rel, content));
```

##### 8b. Add `.proto` support

**`src/runtime.ts`:**
1. Add `'.proto'` to `textExtensions`.
2. Map `'.proto': 'protobuf'` in `languageForPath`.

**`src/checks/corpus.ts`:**
Add a `extractProtoIndex` function that extracts named `message`, `service`, and `enum` definitions:
```typescript
const protoDefinitionPattern =
  /^(?:message|service|enum)\s+(\w+)/gm;

function extractProtoIndex(path: string, content: string) {
  const records = [];
  for (const match of content.matchAll(protoDefinitionPattern)) {
    records.push({
      path,
      depth: 1,
      heading: match[1] ?? '',
      package: packageOwner(path),
      tier: tierForPath(path),
    });
  }
  return records;
}
```
In `runCorpusCheck`, add alongside the graphql branch:
```typescript
if (extname(rel) === '.proto') docRecords.push(...extractProtoIndex(rel, content));
```

##### 8c. Chunking strategy for large files

The current `chunkFile` in `runtime.ts` uses a fixed 80-line window for source files and 60-line window for docs. For `.graphql` and `.proto` files, semantic boundaries (per-definition) are better than line-count windows.

Add a `chunkByDefinition` helper that splits on top-level definition boundaries (matching `graphqlDefinitionPattern` / `protoDefinitionPattern`) so each chunk contains exactly one complete definition. Fall back to the fixed-size window if no definitions are found.

##### 8d. Chunking strategy for large `.ts` files

For source files over the soft limit (250 lines), the current fixed-window chunking may split across function bodies. A future improvement: detect `export function` / `export class` / `export const` at column 0 as chunk boundaries, same approach as graphql/proto.

This is a single-function change in `chunkFile` in `runtime.ts`.

#### 9. CI Integration
**Priority:** Low  
**Status:** Pending

- Add GitHub Actions workflow for running checks
- Configure failure thresholds
- Add artifact upload for reports
