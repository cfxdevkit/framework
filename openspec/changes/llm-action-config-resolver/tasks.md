## P1 — Create resolveActionConfig

- [x] **P1.1** Create `llm-agents/workers/completion/resolve-action.ts` with:
  - `ActionConfig` type (`action`, `model`, `baseUrl`, `provider`, `apiKey`, `isCloud`, `profileName`)
  - `resolveActionConfig(action: string, config: LlmConfig): ActionConfig`
  - Resolution order: `actionPolicies[action].model` → `providerProfiles[profile].defaultModel`
    → `actions[action]` → `config.defaultModel` → `'Qwen3-Coder-Next-GGUF'`
  - baseUrl order: `providerProfiles[profile].baseUrl` → `config.baseUrl` → lemonade default
  - provider order: `providerProfiles[profile].provider` → `config.provider` → `'lemonade'`
  - `isCloud = provider === 'openai-compat' || provider === 'github-models'`
  - `apiKey = isCloud ? (process.env.GITHUB_TOKEN ?? 'local') : 'local'`
- [x] **P1.2** Export `resolveActionConfig` and `ActionConfig` from `llm-agents/src/index.ts`
- [x] **P1.3** Run `pnpm run typecheck` in `llm-agents` — zero errors

## P2 — Replace manual resolution in wiki.ts

- [x] **P2.1** Import `resolveActionConfig` from `../completion/resolve-action.ts` in `wiki.ts`
- [x] **P2.2** Replace the 15-line manual policy resolution block with:
  `const { baseUrl: gitnexusBase, model, provider, apiKey, profileName } = resolveActionConfig('wiki-generate', config)`
- [x] **P2.3** Remove the manual `isCloudProvider` / `gitnexusBase` / `apiKey` computation blocks
- [x] **P2.4** Keep the `provider` log line; update it to use `provider` + `profileName` from result
- [x] **P2.5** Keep the `/api/v1` suffix logic: move it inside `resolveActionConfig` or keep as a
  post-processing step in `wiki.ts` for the gitnexus-specific path requirement

## P3 — Update complete.ts model selection

- [x] **P3.1** In `complete.ts`, after `readConfig()`, call `resolveActionConfig(opts.action, config)`
  to get `model` and `baseUrl` instead of reading `config.actions[opts.action]` directly
- [x] **P3.2** Ensure the resolved `baseUrl` overrides the global config baseUrl when a profile
  is active (so cloud-routed actions use the right endpoint)

## P4 — Align pi-agent config-policy

- [x] **P4.1** In `pi-agent/src/config-policy.ts`, import `resolveActionConfig` from
  `@cfxdevkit/llm-agents` for the core baseUrl/model/provider triple
- [x] **P4.2** Wrap the result to add `source`, `legacyActionModel`, and phase-level fields that
  the pi-agent bridge needs on top
- [x] **P4.3** Confirm `resolveRuntimeBridgeState` still returns the same shape (no breaking change)

## Validate

- [x] **V.1** `pnpm run typecheck` passes for `llm-agents`, `pi-agent`, and `tooling-cli`
- [x] **V.2** `grep -n "actionPolicies\?\." llm-agents/workers/docs/wiki.ts` → 0 results
- [x] **V.3** `cdk docs wiki generate` resolves `github-cloud` profile and calls Copilot
- [x] **V.4** A local-only action (e.g. `readme-upkeep`) still resolves to `Qwen3-Coder-Next-GGUF`
  and lemonade baseUrl
- [x] **V.5** `pnpm run lint` passes for all affected packages
