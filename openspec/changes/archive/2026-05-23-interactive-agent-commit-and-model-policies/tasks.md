## 1. Commit Workflow Service Extraction

- [x] 1.1 Refactor `repos/cfx-tools/infra/llm-agents/workers/commit/index.ts` to expose non-exiting precommit and commit workflow services with structured progress, gate, failure, approval, and completion state.
- [x] 1.2 Keep deterministic CLI wrappers for `cdk repo precommit` and `cdk repo commit` that translate workflow outcomes into the existing exit-code-oriented behavior.
- [x] 1.3 Add focused tests for recoverable failure states, rerun paths, and deterministic wrapper behavior.

## 2. Provider Profile And Policy Registry

- [x] 2.1 Extend `repos/cfx-tools/infra/llm-client/src/types.ts`, `src/runtime-bridge.ts`, and related config loaders to support named provider profiles plus action/phase policy bindings.
- [x] 2.2 Preserve current default provider/model behavior when no explicit policy is configured, and add tests for fallback, local-profile, and cloud-profile resolution.
- [x] 2.3 Update `repos/cfx-tools/infra/tooling-cli/src/agent-config.ts` and help surfaces to inspect and set provider profiles and action policies.

## 3. PI Interactive Commit Runtime

- [x] 3.1 Add `cdk agent commit` routing in `repos/cfx-tools/infra/tooling-cli/src/agent-namespace.ts` and the corresponding PI runtime entrypoint in `repos/cfx-tools/infra/pi-agent/src/`.
- [x] 3.2 Implement PI commit workflow UI in `repos/cfx-tools/infra/pi-agent/src/ui.ts`, `src/commands.ts`, and related runtime glue to show progress, gate state, remediation guidance, reruns, and approval.
- [x] 3.3 Wire PI commit workflow phases to the new action/phase model policy registry so local and cloud backends can be selected intentionally.

## 4. Validation And Documentation

- [x] 4.1 Add focused tests in `repos/cfx-tools/infra/pi-agent/src/`, `repos/cfx-tools/infra/tooling-cli/src/`, `repos/cfx-tools/infra/llm-client/src/`, and `repos/cfx-tools/infra/llm-agents/workers/commit/` for the new interactive commit flow and policy resolution.
- [x] 4.2 Update runtime documentation in `repos/cfx-tools/infra/tooling-cli/README.md`, `repos/cfx-tools/infra/llm-tools/README.md`, and `docs/architecture/pi-coding-agent-fit.md` to document `cdk agent commit`, deterministic commit separation, and model policy configuration.
- [x] 4.3 Validate representative flows for `cdk repo commit`, `cdk agent commit`, and local-vs-cloud policy selection with focused smoke runs.
