# Setup — Strix Halo / Lemonade

This file is the single reference for the LLM environment running in this workspace.
It documents the hardware, available models, task-tier assignments, and token budget policy.

**Machine-readable runtime config:** `.pi/providers.json`  
**Decision record:** `docs/adr/0004-local-llm-model-routing.md`

---

## Hardware

| Property | Value |
|----------|-------|
| System | AMD Strix Halo (Ryzen AI Max+) |
| Unified memory | 128 GB LPDDR5x |
| NPU | XDNA 2 (50 TOPS) — not yet used for LLM inference |
| Inference backend | Lemonade (llamacpp, GPU-accelerated) |

All models listed below fit simultaneously in unified memory, so there is no model-eviction pressure under normal load. Token budgets are set to use up to 90% of each model's declared context window.

---

## LLM Endpoints

| Property | Value |
|----------|-------|
| Headroom proxy URL | `http://localhost:28787/v1/` |
| Upstream Lemonade URL | `http://host.containers.internal:13305/` |
| Proxy protocol | OpenAI-compatible `/v1/chat/completions` |
| Proxy discovery | `GET /v1/models` |
| Upstream discovery | `GET /api/v1/models` |
| Container network | `pasta:--map-gw` — host reachable at `169.254.1.2` |

Environment variables: `OPENAI_BASE_URL=http://localhost:28787/v1`, `LEMONADE_URL=http://localhost:28787/v1/` (legacy compat)  
Config key: `providers.json → baseUrl`

---

## Model Catalog

### Tier 1 — Lightweight / always-hot

These models stay loaded at all times. They handle background and low-latency tasks
that should not wait for a larger model to load.

#### `Gemma-4-26B-A4B-it-GGUF`

| Property | Value |
|----------|-------|
| Size | 16.9 GB |
| Context window | 262 144 tokens (256k) |
| Labels | `hot`, `tool-calling`, `vision`, `llamacpp` |
| Backend | llamacpp (Unsloth quant `UD-Q4_K_M`) |
| Generation speed | ~48 t/s |
| Assigned actions | `validation` |

**Role:** Instant structured-output tasks that run while the user is idle or the heavier
models are busy. At 16.9 GB it is the smallest model with the `hot` label and reliable
tool-calling. Keeping this tier hot means `Qwen3-Coder-Next` does not need to stay
resident — freeing VRAM headroom when `Qwen3.5-122B` loads.

**Notes on thinking mode:** Gemma-4 uses extended thinking (`reasoning_content`) before
producing its answer. A budget of ≥4 096 tokens is required for the reasoning pass to
complete. With the 90% context fraction on 128 GB hardware this is never an issue.

---

### Tier 2 — Documentation / coding (default model)

#### `Qwen3-Coder-Next-GGUF` ★ default

| Property | Value |
|----------|-------|
| Size | 43.7 GB |
| Context window | 262 144 tokens (256k) |
| Labels | `coding`, `tool-calling`, `hot` |
| Backend | llamacpp (Unsloth MXFP4 MoE) |
| Generation speed | ~48 t/s |
| Assigned actions | `docs-api`, `readme-upkeep`, `package-pages`, `structure-upkeep`, `docs-upkeep` |

**Role:** All deterministic documentation churn (API docs, README enrichment, MDX pages,
STRUCTURE.md generation, docs maintenance). The model stays hot and handles the default
path for any action not in the `actions` map.

#### `Qwen3-Coder-30B-A3B-Instruct-GGUF`

| Property | Value |
|----------|-------|
| Size | 18.6 GB |
| Context window | 262 144 tokens (256k) |
| Labels | `coding`, `tool-calling`, `hot` |
| Backend | llamacpp (Q4_K_M) |
| Assigned actions | *(none — spare tier-2 capacity)* |

**Role:** Available as a lighter-weight tier-2 alternative if VRAM pressure from
concurrent `Qwen3.5-122B` loads becomes an issue. Currently unassigned.

---

### Tier 3 — High reasoning (on-demand)

#### `Qwen3.5-122B-A10B-GGUF-Q4_K_M`

| Property | Value |
|----------|-------|
| Size | ~47 GB (MoE active params) |
| Context window | 262 144 tokens (256k) |
| Labels | `custom` |
| Backend | llamacpp (Unsloth Q4_K_M) |
| Generation speed | ~13 t/s |
| Assigned actions | `review`, `commit`, `test-audit`, `repo-health`, `changeset`, `release-readiness`, `ci-cd`, `docs-pipeline` |

**Role:** Cross-cutting reasoning tasks — code review, commit risk assessment, release
sign-off, CI/CD failure analysis. The user explicitly triggers these tasks and tolerates
the cold-start latency (~30–40 s first inference) because quality of analysis matters.

**Extended thinking:** This model uses extended thinking (`reasoning_content`) before
answering. On complex tasks the reasoning pass consumes 1 000–5 000 tokens before any
content is produced. Always ensure `max_tokens` is large enough (see Token Budget below).

---

### Cloud — OpenRouter (preferred) → GitHub Copilot (fallback)

Cloud calls (interactive `cdk agent chat --github` and cloud-routed actions such as
`wiki-generate`) prefer **OpenRouter** whenever an OpenRouter key is present, and fall
back to GitHub Copilot otherwise. No config edits are required — detection is automatic.

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | When set, all cloud calls route through OpenRouter. |
| `OPENROUTER_MODEL` | Optional model override (default `deepseek-v4-pro`). |

When `OPENROUTER_API_KEY` is set:

| Property | Value |
|----------|---------|
| Endpoint | `https://openrouter.ai/api/v1` |
| Auth | `OPENROUTER_API_KEY` env (Bearer) |
| Provider type | `openai-compat` |
| Default model | `OPENROUTER_MODEL` env, else `deepseek-v4-pro` |

#### Fallback — `claude-sonnet-4.6` via GitHub Copilot

Used only when **no** `OPENROUTER_API_KEY` is found.

| Property | Value |
|----------|---------|
| Endpoint | `https://api.githubcopilot.com` |
| Auth | `GITHUB_TOKEN` env (OAuth, auto-refreshed by pi agent) |
| Provider type | `openai-compat` |
| Profile name | `github-cloud` |
| Assigned actions | `wiki-generate` |

**Role:** Wiki generation via `gitnexus wiki`. The local 122B model was too heavy and
had reasoning-content incompatibilities with gitnexus. Claude Sonnet 4.6 handles the
full codebase context and structured page output reliably. Other GPT-5.x models are also
available at this endpoint if needed (`gpt-5.4`, `gpt-5.5`, etc.).

**How routing works:** `wiki.ts` reads `actionPolicies['wiki-generate']` → `profile: 'github-cloud'`
→ resolves `baseUrl` + `provider` from `providerProfiles['github-cloud']`. The cloud-credential
resolver then overrides the endpoint/key/model with OpenRouter when `OPENROUTER_API_KEY` is set.
For `openai-compat` providers it skips the local `/api/v1` path suffix and uses the resolved
bearer token as the API key.

---

### Available but unassigned

| Model | Size | Labels | Notes |
|-------|------|--------|-------|
| `Qwen2.5-Coder-1.5B-Instruct-GGUF` | — | custom | Tiny coder; useful for inline completions or very fast structured tasks |
| `MiniMax-M2.5-GGUF-UD-IQ3_XXS` | — | custom | Large MoE; evaluate for tier-3 if 122B VRAM conflicts arise |
| `gemma4-it-e4b-FLM` | 9.1 GB | audio, vision, reasoning, tool-calling, chat-transcription | FLM backend; requires OS-level NPU changes for parallel use — deferred |

---

## Token Budget Policy

Config key: `providers.json → tokenBudget`

| Field | Strix Halo value | Description |
|-------|-----------------|-------------|
| `contextFraction` | `0.9` | Use 90% of each model's declared context window as `max_tokens`. Leaves 10% for the prompt. |
| `cap` | `null` | No hard cap. On 128 GB hardware the full context window is always available. |
| `quick` | `8192` | Budget for `--quick` flag. Still enough for extended thinking models to complete. |
| `cloudFallback` | `4096` | Fallback when model has no context window (cloud/gateway models). Conservative to avoid cost overruns. |

**How the budget is computed** (implemented in `resolveMaxTokens`):
```
maxTokens = min(contextWindow × contextFraction, cap)
          = 262144 × 0.9 ≈ 235 929 (with cap=null → 235 929)
```

For quick mode: `max(quick, computedFull / 4)` = `max(8192, 58982)` = `58982`

---

## Action Routing Reference

Full mapping: `providers.json → actions`

| Action | Model | Tier | Why |
|--------|-------|------|-----|
| `validation` | `Gemma-4-26B-A4B-it-GGUF` | 1 | Instant command suggestions; always-hot |
| `docs-api` | `Qwen3-Coder-Next-GGUF` | 2 | API doc generation |
| `readme-upkeep` | `Qwen3-Coder-Next-GGUF` | 2 | README prose enrichment |
| `package-pages` | `Qwen3-Coder-Next-GGUF` | 2 | MDX docs-site pages |
| `structure-upkeep` | `Qwen3-Coder-Next-GGUF` | 2 | STRUCTURE.md generation |
| `docs-upkeep` | `Qwen3-Coder-Next-GGUF` | 2 | Doc maintenance recommendations |
| `review` | `Qwen3.5-122B-A10B-GGUF-Q4_K_M` | 3 | Code review, security risk |
| `commit` | `Qwen3.5-122B-A10B-GGUF-Q4_K_M` | 3 | Commit message + risk |
| `test-audit` | `Qwen3.5-122B-A10B-GGUF-Q4_K_M` | 3 | Coverage gap analysis |
| `repo-health` | `Qwen3.5-122B-A10B-GGUF-Q4_K_M` | 3 | Repo drift + automation |
| `changeset` | `Qwen3.5-122B-A10B-GGUF-Q4_K_M` | 3 | Changeset readiness |
| `release-readiness` | `Qwen3.5-122B-A10B-GGUF-Q4_K_M` | 3 | Release blockers |
| `ci-cd` | `Qwen3.5-122B-A10B-GGUF-Q4_K_M` | 3 | Pipeline failure modes |
| `docs-pipeline` | `Qwen3.5-122B-A10B-GGUF-Q4_K_M` | 3 | Docs build/deploy risk |
| *(any other)* | `Qwen3-Coder-Next-GGUF` | 2 | `defaultModel` fallback |

To change routing: edit `providers.json → actions.<action>` to a different model ID.  
To verify: run `cdk agent smoke`.

---

## Reconfiguring for Different Hardware

### Laptop (16 GB unified or discrete VRAM)

Only one large model at a time; disable tier-3 routing or use a smaller model.

```json
{
  "defaultModel": "Qwen3-Coder-30B-A3B-Instruct-GGUF",
  "actions": {
    "validation": "Qwen2.5-Coder-1.5B-Instruct-GGUF",
    "review": "Qwen3-Coder-Next-GGUF",
    "commit": "Qwen3-Coder-Next-GGUF"
  },
  "tokenBudget": {
    "contextFraction": 0.5,
    "cap": 16384,
    "quick": 2048,
    "cloudFallback": 2048
  }
}
```

### CI / remote (no local Lemonade)

Switch to GitHub Models. Set `GITHUB_TOKEN` env var.

```json
{
  "provider": "github-models",
  "defaultModel": "gpt-4o-mini",
  "tokenBudget": {
    "cloudFallback": 4096,
    "quick": 512
  }
}
```

---

## Phase-Level Routing (Future)

The `actionPolicies` key supports per-phase model overrides within compound workflows
(e.g. commit message generation vs commit failure analysis). This is not yet wired in
`resolveExecutionContext` — tracked in `openspec/specs/agent-model-policy-registry`.

When implemented, an entry like this would route failure analysis to the 122B model
while keeping the cheaper message generation on tier 2:

```json
"actionPolicies": {
  "commit": {
    "phases": {
      "failure-analysis": { "model": "Qwen3.5-122B-A10B-GGUF-Q4_K_M" },
      "message-generation": { "model": "Qwen3-Coder-Next-GGUF" }
    }
  }
}
```

---

## Signer Configuration

The framework uses `.cfxdevkit/signer.json` for signing identity (parallel to `.pi/providers.json` for LLM config).

**First-time setup:**
```bash
cdk signer setup    # interactive wizard
cdk signer status   # verify
cdk sign message "Hello Conflux"   # test
```

**Signer kinds:**

| Kind | Use case | Auth |
|---|---|---|
| `memory` | Quick testing (⚠ ephemeral) | None |
| `file-keystore` | Dev work | `CFX_PASSPHRASE` env var |
| `onekey` | Production-like, hardware | Device via WebUSB |
| `ledger` | Production-like, hardware | Device via WebHID/HID |

**Env vars:**

| Variable | Purpose |
|---|---|
| `CFX_SIGNER_NAME` | Override the active signer |
| `CFX_PASSPHRASE` | File keystore passphrase |
| `CFX_KEYSTORE_PATH` | Override keystore path |
