## Why

The PI-backed `cdk agent` runtime now supports interactive, print, and RPC sessions, but commit orchestration still lives in the deterministic `cdk repo commit` flow. That keeps the current control plane stable, but it also means the operator cannot stay inside the PI session, watch repository-policy and quality checks progress, inspect failures in structured UI, collaborate with the agent to resolve issues, and then continue the commit workflow without restarting from the CLI.

The provider/config layer also still behaves like a single-active-backend system. That is too narrow for the next runtime shape. The repository needs a configuration registry that can express local-fast versus cloud-strong profiles and map them to agent actions or workflow phases so low-risk housekeeping can default to local models while refactors, development, and failure remediation can use stronger remote models.

## What Changes

- Add `cdk agent commit` as a PI-backed interactive entrypoint for commit orchestration while keeping `cdk repo commit` and `cdk repo precommit` deterministic and independent.
- Refactor commit/precommit orchestration into a non-exiting workflow service that emits structured progress, gate, failure-analysis, approval, and completion state for PI consumers.
- Add PI operator UI for commit workflow progress, blocking issue review, remediation guidance, rerun/continue actions, and final approval.
- Extend the LLM config/runtime bridge with named provider profiles and action/phase model policies so PI and CLI runtimes can choose local or cloud backends intentionally.
- Preserve existing fallback behavior for workflows that do not define explicit model policies.

## Capabilities

### New Capabilities
- `agent-commit-runtime`: A PI-backed interactive commit workflow surfaced as `cdk agent commit`, including progress rendering, failure-state interaction, and resumable continuation.
- `agent-model-policy-registry`: A configuration registry of provider profiles and action/phase policies that maps repo actions to local or cloud model backends.

### Modified Capabilities
- `llm-agents`: Commit and precommit orchestration will change from process-exiting CLI-first flows to shared non-exiting workflow services with CLI wrappers.
- `llm-client`: Runtime config resolution will change from a single active backend model to profile- and policy-aware resolution while preserving current default behavior.
- `tooling-cli`: The `cdk agent` surface will change to add `commit` as an interactive PI entrypoint and to expose model-policy configuration controls.
- `pi-agent-runtime`: The PI runtime will change to host commit workflow UI, rerun/continue behavior, and action-aware model selection.

## Impact

Affected areas include `repos/cfx-tools/infra/llm-agents/workers/commit/`, `repos/cfx-tools/infra/llm-client/src/`, `repos/cfx-tools/infra/tooling-cli/src/`, and `repos/cfx-tools/infra/pi-agent/src/`, plus repo-local `.pi/` resources and the shared LLM config under `artifacts/llm/config/`. User-facing behavior will change by adding a new interactive `cdk agent commit` path, richer PI workflow UI for commit/precommit remediation, and configurable local-versus-cloud model routing per action or workflow phase, while keeping the existing deterministic `cdk repo commit` contract intact.
