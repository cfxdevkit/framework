## Context

The repository already has the right split for this next step:
- `cdk` is the root control plane
- `pi-agent` owns the PI runtime behind `cdk agent`
- `llm-agents` owns repo-aware workflow logic
- `llm-client` owns provider/config/model resolution

The current gap is that commit orchestration is still CLI-first. `runPrecommit()` and `runCommit()` in `llm-agents` produce useful structured data, but they still terminate the process on failure and are wrapped for deterministic terminal use. PI already has the UI surfaces needed to render workflow state, but it cannot keep the operator inside a remediation loop while the underlying workflow exits out from under it.

At the same time, `llm-client` still models one selected provider plus one default model. That works for today’s repo-wide default behavior but not for the desired runtime where documentation and housekeeping can default to local models while refactoring, development, or commit-failure remediation can switch to stronger cloud models.

## Goals / Non-Goals

**Goals:**
- Add `cdk agent commit` as a PI-backed interactive commit workflow.
- Preserve `cdk repo commit` and `cdk repo precommit` as deterministic, independent command surfaces.
- Refactor commit/precommit orchestration into a non-exiting shared workflow service with structured progress and failure states.
- Add provider profiles and action/phase model policies so runtimes can choose local or cloud backends intentionally.
- Reuse PI UI to show workflow progress, gates, issues, remediation guidance, reruns, and approval.

**Non-Goals:**
- Remove or replace `cdk repo commit` in this change.
- Turn every deterministic repo command into an interactive PI workflow.
- Require LiteLLM for every backend. LiteLLM is an important gateway option, but direct provider profiles remain valid.
- Standardize Copilot-subscription-specific auth semantics in the first slice. The registry should support current `llm-client` providers and gateway-backed cloud profiles without depending on one proprietary auth path.

## Decisions

### 1. `cdk agent commit` becomes the interactive entrypoint; `cdk repo commit` stays deterministic
`tooling-cli` will add `cdk agent commit` as a PI-backed workflow entrypoint. This command is intended for sessioned operator work: visible progress, issue review, remediation, reruns, and final approval.

`cdk repo commit` remains the non-interactive deterministic command for scripts, CI-adjacent local usage, and maintainers who want the existing exit-code-oriented contract.

Rationale:
- preserves the root CLI taxonomy
- keeps deterministic and interactive concerns separate
- avoids breaking existing automation

### 2. Extract a non-exiting commit workflow service from `llm-agents`
The commit domain logic should be split into:
- a shared workflow engine that returns structured state and emits progress events
- thin CLI wrappers that preserve current `process.exit(...)` behavior for deterministic commands

The workflow engine should model phases such as:
- execution-context resolution
- repository policy gates
- quality gates
- preflight collection
- scope detection
- release/changeset planning
- commit message generation
- remediation-ready failure state
- approval
- post-generation checks
- commit execution

Rationale:
- PI needs a resumable workflow, not a process-exiting command
- CLI wrappers can continue translating workflow state into exit codes without duplicating logic

### 3. PI consumes workflow events and keeps the operator in the loop
`pi-agent` should render the commit workflow as an operator loop instead of a one-shot action.

The UI contract should include:
- live phase/progress state
- structured gate summaries
- failure analysis and remediation guidance
- commands/actions to rerun failed checks
- commands/actions to ask the agent to propose or apply a fix
- explicit transition to final approval and commit execution

On failure, the workflow should stop in a recoverable state rather than exiting. The PI session remains active so the maintainer can inspect findings, direct the agent to repair issues, and then continue or rerun the blocked phase.

### 4. Add a provider profile registry to `llm-client`
`llm-client` should be extended with named provider profiles rather than only a single selected provider/default model.

A profile should capture:
- provider type
- base URL or gateway URL
- default model
- optional auth source or provider-specific metadata
- strategy semantics (`direct`, `gateway`, `auto`) where relevant

Examples:
- `local-fast` -> LiteLLM/Lemonade-backed local model
- `cloud-strong` -> GitHub Models or other remote cloud model
- `cloud-review` -> remote review/failure-analysis profile if distinct from general development

### 5. Add action and phase model policies
The config should support mapping runtime work to profiles.

At minimum:
- action policies: `docs-upkeep -> local-fast`, `commit -> cloud-strong`
- phase policies inside compound workflows: `commit.failure-analysis -> cloud-strong`, `commit.message-generation -> cloud-strong`

If no explicit policy exists, the runtime should fall back to the current repo default resolution path so the change remains backward-compatible.

### 6. LiteLLM is a key gateway, but not the only valid backend path
The design should treat LiteLLM as a first-class broker for local and optionally remote upstreams, because it is the cleanest path for unified OpenAI-compatible routing. But the registry should not force everything through LiteLLM.

Direct profiles remain valid for:
- GitHub Models
- direct OpenAI-compatible endpoints
- future provider-specific integrations already supported by `llm-client`

This preserves flexibility while still allowing one gateway profile to proxy both local and remote models where the team chooses to configure it that way.

### 7. Configuration and help surfaces must expose policy control intentionally
`tooling-cli` should add configuration verbs for:
- listing provider profiles
- showing action policies
- setting action-policy profile bindings
- optionally setting phase-policy bindings

The help text should make the distinction clear:
- `cdk repo commit`: deterministic CLI workflow
- `cdk agent commit`: interactive PI workflow

## Risks / Trade-offs

- The commit workflow service extraction touches the most sensitive repo-maintenance path -> Mitigation: keep CLI wrappers thin and preserve existing deterministic behavior in tests.
- Action/phase policies can become hard to reason about if they are too implicit -> Mitigation: provide explicit config inspection commands and surface the chosen profile/model in PI UI.
- Gateway-vs-direct profile behavior can drift if routing rules are duplicated -> Mitigation: keep `llm-client` as the only place that resolves profiles and defaults.
- Cloud-profile auth semantics may differ by provider -> Mitigation: first slice supports current `llm-client` providers and gateway-backed profiles; provider-specific auth expansion stays behind profile definitions rather than PI-only code.

## Migration Plan

1. Extract non-exiting commit/precommit workflow engines in `llm-agents` and preserve CLI wrappers for deterministic commands.
2. Add structured workflow events and recoverable failure states for PI consumers.
3. Extend `llm-client` config/types/runtime bridge with provider profiles and action/phase policy resolution.
4. Add `cdk agent commit` routing in `tooling-cli` and interactive commit commands/tools in `pi-agent`.
5. Implement PI operator UI for commit progress, failure remediation, reruns, and approval.
6. Add focused tests for workflow-state transitions, policy resolution, and new `cdk agent commit` behavior.
7. Update runtime docs to distinguish deterministic commit flows from interactive PI commit orchestration.

## Open Questions

- Should phase policies be expressed as dotted keys like `commit.failure-analysis`, or as nested workflow policy objects?
- Do we want an explicit “profile capability” field so actions can request reasoning-capable or low-cost models without naming a profile directly?
- Should `cdk agent commit` support an eventual non-interactive fallback mode, or remain PI-interactive by design?
