## Context

`LlmConfig` has two routing layers:
1. **Legacy `actions` map** — `actions[actionName] = modelId` (flat, no provider switching)
2. **New `actionPolicies` map** — `actionPolicies[actionName] = { profile?, model? }` with
   optional `providerProfiles[profileName] = { provider, baseUrl, defaultModel }` indirection

Callers currently must implement the fallback chain themselves:
`actionPolicies[a]?.model ?? providerProfiles[actionPolicies[a]?.profile]?.defaultModel ?? actions[a] ?? config.defaultModel`

plus separate logic for baseUrl, provider type, and API-key selection.

## Goals / Non-Goals

**Goals:**
- One function resolves the complete routing for an action: model, baseUrl, provider,
  API key, and a boolean `isCloud` flag
- All existing callers use that function
- The return type is exported from `llm-agents` so `pi-agent` and `wiki.ts` share it

**Non-Goals:**
- Changing the `LlmConfig` schema (no new fields)
- Merging `pi-agent`'s provider-bridge logic (it does extra things like PI shell
  registration; only the config-resolution part aligns here)

## Decisions

**Single function, flat return.** `resolveActionConfig(action, config)` returns:
```ts
{
  action: string;
  model: string;
  baseUrl: string;
  provider: LlmProviderType;
  apiKey: string;       // 'local' for lemonade, env token for cloud
  isCloud: boolean;
  profileName: string | null;
}
```

**API-key selection logic lives here.** The rule is: `openai-compat` and `github-models`
providers use `process.env.GITHUB_TOKEN ?? 'local'`; all others use `'local'`. Centralising
this prevents the bug where a new cloud provider gets `'local'` by accident.

**Placed in `completion/` not `shared/`.** It depends on `LlmConfig` and the provider type
union — both already live in `completion/types.ts`. No circular dep risk.

## Risks / Trade-offs

- `pi-agent/config-policy.ts` has a richer return shape (includes `effectivePolicy.source`,
  legacy flag, phase-level overrides). Full alignment is out of scope; the goal is that the
  core baseUrl/model/provider triple is computed by the shared function and `config-policy.ts`
  wraps it.
