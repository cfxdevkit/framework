## 1. PI Runtime Package Setup

- [x] 1.1 Create the new `repos/cfx-tools/infra/pi-agent/package.json`, `repos/cfx-tools/infra/pi-agent/moon.yml`, `repos/cfx-tools/infra/pi-agent/tsconfig.json`, `repos/cfx-tools/infra/pi-agent/vite.config.ts`, and `repos/cfx-tools/infra/pi-agent/src/index.ts` package scaffold.
- [x] 1.2 Implement PI runtime entrypoints and repo extension bootstrapping in `repos/cfx-tools/infra/pi-agent/src/runtime.ts`, `repos/cfx-tools/infra/pi-agent/src/extension.ts`, and `repos/cfx-tools/infra/pi-agent/src/providers.ts`.
- [x] 1.3 Add project-local PI resources in `.pi/settings.json`, `.pi/prompts/repo-system.md`, `.pi/skills/repo-actions.md`, and `.pi/extensions/repo-agent.ts`.

## 2. Shared Action And Provider Contracts

- [x] 2.1 Factor typed repo action definitions into `repos/cfx-tools/infra/llm-agents/workers/shared/repo-actions.ts` and update `repos/cfx-tools/infra/llm-agents/workers/shared/index.ts` plus `repos/cfx-tools/infra/llm-agents/src/index.ts` exports to use the shared contract.
- [x] 2.2 Add structured runtime-facing workflow payloads in `repos/cfx-tools/infra/llm-agents/workers/commands.ts`, `repos/cfx-tools/infra/llm-agents/workers/shared/execution-context.ts`, and `repos/cfx-tools/infra/llm-agents/workers/commit/index.ts` for PI consumers.
- [x] 2.3 Add runtime bridge APIs in `repos/cfx-tools/infra/llm-client/src/runtime-bridge.ts`, `repos/cfx-tools/infra/llm-client/src/types.ts`, and `repos/cfx-tools/infra/llm-client/src/index.ts` to resolve scoped config, providers, and model metadata for PI registration.

## 3. CLI And Compatibility Wiring

- [x] 3.1 Rewire `repos/cfx-tools/infra/tooling-cli/src/agent-namespace.ts` and `repos/cfx-tools/infra/tooling-cli/src/agent-help.ts` so `interactive`, `print`, and `rpc` delegate to `@cfxdevkit/pi-agent`.
- [x] 3.2 Add `@cfxdevkit/pi-agent` package dependencies and delegation wiring in `repos/cfx-tools/infra/tooling-cli/package.json`, `repos/cfx-tools/infra/llm-tools/package.json`, and `repos/cfx-tools/infra/llm-tools/src/run.ts`.
- [x] 3.3 Preserve `llm-tools` compatibility entrypoints by updating `repos/cfx-tools/infra/llm-tools/src/commands.ts` and `repos/cfx-tools/infra/llm-tools/src/namespace.ts` to point PI-backed modes at the delegated runtime path.

## 4. PI Operator UI

- [x] 4.1 Implement PI command and tool registration in `repos/cfx-tools/infra/pi-agent/src/commands.ts`, `repos/cfx-tools/infra/pi-agent/src/tools.ts`, and `repos/cfx-tools/infra/pi-agent/src/runtime.ts` using the shared repo action registry.
- [x] 4.2 Render execution context, gate reports, and failure analysis in `repos/cfx-tools/infra/pi-agent/src/ui.ts` using the structured payloads returned by `llm-agents`.

## 5. Validation And Documentation

- [x] 5.1 Add focused tests in `repos/cfx-tools/infra/pi-agent/src/runtime.test.ts`, `repos/cfx-tools/infra/tooling-cli/src/agent-namespace.test.ts`, `repos/cfx-tools/infra/llm-tools/src/run.test.ts`, and `repos/cfx-tools/infra/llm-client/src/runtime-bridge.test.ts`.
- [x] 5.2 Update runtime documentation in `repos/cfx-tools/infra/tooling-cli/README.md`, `repos/cfx-tools/infra/llm-tools/README.md`, and `docs/architecture/pi-coding-agent-fit.md` to describe the PI-backed `cdk agent` path.
- [x] 5.3 Validate the integration with focused package tests plus representative `cdk agent interactive`, `cdk agent print`, and `cdk agent rpc` smoke runs.