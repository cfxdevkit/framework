## Context

### Config fragmentation today

```
loadBaseConfig() resolution order:
  1. .pi/providers.json         ← CANONICAL  (actions, tokenBudget, harness, ...)
  2. artifacts/llm/config/llm.json     ← STALE COPY (no actions, no tokenBudget)
  3. artifacts/llm/config/lemonade.json ← WRONG defaultModel, no actions
```

Files 2 and 3 pre-date the migration to `.pi/providers.json`. Because resolution stops at the first found file and `.pi/providers.json` always exists, the legacy files are unreachable dead weight — but they mislead anyone reading the config directory.

### Package dependency graph

```
arch-check  ──── re-exported by ──→  cdk-repo-check (export * from arch-check)
                                            │
arch-check  ──── also imported by ─→  llm-agents/docs/* (4 files)
```

`cdk-repo-check` already re-exports every symbol needed by `llm-agents/docs/*` (confirmed via dist inspection). The direct `arch-check` dependency in `llm-agents` is redundant and creates a bypass around the structured execution layer.

### `cdk-ai` role clarification

`cdk-ai` is a pure re-export barrel with no own code:
```ts
export * from '@cfxdevkit/llm-agents';
export * from '@cfxdevkit/pi-agent';
```
Its purpose is to serve as the **dynamic module boundary** in `tooling-cli/agent-runtime.ts`. `loadWorkspaceModule` uses `@cfxdevkit/cdk-ai` as the package specifier and the existence of `cdk-ai/dist/index.js` as the "built runtime" signal. This is intentional — it prevents `tooling-cli` from having a hard build-time dependency on either `llm-agents` or `pi-agent`. No action needed beyond documenting this.

### Hardware + model intent — no single place

The intent currently lives across:
- `.pi/providers.json` — routing + budget (values, no rationale)
- `docs/adr/0004` — rationale (historical snapshot, not kept current)
- `openspec/specs/local-model-routing` — requirements (abstract)

None of these answer: *"what models does this machine have loaded, what are they for, how do I change the setup for different hardware?"*

## Goals / Non-Goals

**Goals:**
- `.pi/SETUP.md` declares hardware, endpoint, model catalog, tier rationale, and reconfiguration instructions in one place.
- `providers.json` gains a `catalog` array so tools can programmatically verify model availability and assignments.
- `llm-agents` doc workers import from `cdk-repo-check`, removing the direct `arch-check` bypass.
- Legacy config files deleted; canonical path is the only source.

**Non-Goals:**
- Changing how `cdk-ai` works — it is already correct as a dynamic module boundary.
- Merging `arch-check` into `cdk-repo-check` at the source level — `arch-check` is a separate package for a reason (used by arch rules, docs pipeline, etc.).
- Auto-generating `SETUP.md` from the API — it's a curated document, not a generated report.

## Decisions

### D1 — `.pi/SETUP.md` is curated, not generated

The setup document is written and maintained by humans. It explains *why* each model is assigned to each tier, not just what the current routing is. It references `providers.json` as the machine-readable source of truth and describes how to change the configuration.

Structure:
```
# Setup — Strix Halo / Lemonade

## Hardware
## Lemonade Endpoint
## Model Catalog
  ### Tier 1 — Lightweight / always-hot
  ### Tier 2 — Documentation / coding
  ### Tier 3 — High reasoning
  ### Available but unassigned
## Token Budget Policy
## Action Routing (providers.json reference)
## Reconfiguring for Different Hardware
## Cloud Fallback (GitHub Models)
```

### D2 — `providers.json` gains a `catalog` array (informational, not runtime)

```json
"catalog": [
  {
    "id": "Gemma-4-26B-A4B-it-GGUF",
    "tier": 1,
    "role": "Lightweight always-hot model for low-latency background tasks",
    "assignedActions": ["validation"],
    "contextWindow": 262144,
    "sizeGb": 16.9,
    "labels": ["hot", "tool-calling", "vision", "llamacpp"]
  },
  ...
]
```

`catalog` is not consumed by `resolveMaxTokens` or routing — it's metadata for documentation and smoke-test verification. The `smoke.ts` can optionally cross-reference discovered models against the catalog to warn about unregistered or missing models.

### D3 — `llm-agents` doc workers: import source change only

Change four import lines:
```ts
// before
import { isDocumentationUpkeepPath } from '@cfxdevkit/arch-check';
// after
import { isDocumentationUpkeepPath } from '@cfxdevkit/cdk-repo-check';
```

No type or behavior change — `cdk-repo-check` re-exports the same symbols. Remove `@cfxdevkit/arch-check` from `llm-agents/package.json` `dependencies` after confirming no other direct usage.

### D4 — Legacy files deleted, not redirected

`artifacts/llm/config/llm.json` and `lemonade.json` are deleted. The `loadBaseConfig()` fallback chain in `config.ts` stays intact (it still handles `ENOENT` gracefully) — the files just no longer exist. No migration needed since `.pi/providers.json` has always been the canonical source when present.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| `SETUP.md` drifts from `providers.json` | Both live in `.pi/`; `cdk agent config show` and `cdk agent smoke` show the live routing — easy to spot drift |
| Deleting legacy files breaks a workflow that still reads them | `config.ts` resolution stops at `.pi/providers.json` (exists, non-null); legacy files were unreachable already |
| `arch-check` import change breaks doc workers | All symbols confirmed present in `cdk-repo-check` dist before change |
| `catalog` in `providers.json` becomes stale | It's informational metadata, not runtime routing; staleness is visible via smoke test |
