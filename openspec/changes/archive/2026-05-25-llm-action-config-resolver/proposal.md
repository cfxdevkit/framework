## Why

Action→provider config resolution is duplicated in three places:

1. **`llm-agents/workers/docs/wiki.ts`** — manually walks `actionPolicies[action]` →
   `providerProfiles[profile]` to get `baseUrl`, `model`, `provider`, then decides the
   API key. Added today as a one-off for wiki generation.
2. **`pi-agent/src/config-policy.ts`** — `resolveRuntimeBridgeState()` resolves the same
   policy chain for the pi-agent provider bridge.
3. **`llm-agents/workers/completion/complete.ts`** / `providers.ts` — reads `actions[action]`
   for model selection but ignores `actionPolicies` and `providerProfiles` entirely.

Each copy has subtly different logic and different return shapes. Adding a new cloud
provider (as done today for `wiki-generate`) requires updating all three sites. This is
the definition of an antipattern.

## What Changes

- Add a single `resolveActionConfig(action, config)` function in
  `llm-agents/workers/completion/` that returns a typed `ActionConfig` record
  (`{ baseUrl, model, provider, apiKey, isCloud, profile }`).
- `wiki.ts` replaces its manual resolver with `resolveActionConfig`.
- `complete.ts` uses `resolveActionConfig` for model selection (replacing the bare
  `config.actions[action]` lookup).
- `pi-agent/config-policy.ts` delegates its policy resolution to `resolveActionConfig`
  (or imports the result type and aligns its shape).

## Capabilities

### New Capabilities
- `llm-action-config-resolver`: `resolveActionConfig(action, config)` — single source of
  truth for action→provider routing.

### Modified Capabilities

## Impact

- `repos/cfx-tools/infra/llm-agents/workers/completion/resolve-action.ts` — new file
- `repos/cfx-tools/infra/llm-agents/workers/docs/wiki.ts` — use `resolveActionConfig`
- `repos/cfx-tools/infra/llm-agents/workers/completion/complete.ts` — use `resolveActionConfig`
- `repos/cfx-tools/infra/pi-agent/src/config-policy.ts` — align with or delegate to `resolveActionConfig`
- `repos/cfx-tools/infra/llm-agents/src/index.ts` — export `resolveActionConfig`
