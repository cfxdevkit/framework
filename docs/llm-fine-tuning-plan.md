# Repository-Centered LLM Automation Plan

This document is a planning artifact only. It describes how this repository can
produce automation workflows, datasets, evaluations, adapters, and local model
artifacts for repository management. The goal is not just fine-tuning a model;
the goal is a local automation system that can help keep this repository aligned
across documentation, code review, code completion, agentic development, and
validation loops.

The first implementation should prefer deterministic repository automation and
retrieval over training. Fine-tuning should happen only after the corpus,
evaluation gates, safety filters, and local serving path prove that the model is
improving repo-specific work rather than memorizing stale structure.

## Target System

The primary local target is a Strix Halo system:

- CPU/APU: AMD Ryzen AI Max+ 395
- Memory: 128 GB unified system memory
- Host OS: Fedora 43
- Container runtime: Podman
- Interactive development shell: Toolbx / Toolbox containers
- Installed local inference surface: Lemonade Server on AMD Strix Halo
- Preferred isolation model: rootless Podman where possible, with explicit GPU
  device passthrough for training containers

The target should be treated as a powerful local workstation, not as a cloud GPU
cluster. The plan therefore prioritizes repository-specific automation,
retrieval-augmented local inference through Lemonade Server, careful dataset
quality, quantized inference, and small/medium model choices over full
fine-tuning of large models.

## Research Notes

- Toolbx is built on Podman and provides interactive development containers
  with access to the user's home directory, host networking, display sockets,
  SSH agent, D-Bus, `/dev`, udev data, and the host filesystem at `/run/host`.
  That makes it suitable for repo automation, dataset generation, and editor
  workflows that should not install every dependency on the Fedora host.
- Podman supports device passthrough with `--device`, AMD/NVIDIA GPU selection
  through `--gpus`, rootless supplementary group propagation with
  `--group-add keep-groups`, named volumes, bind mounts, tmpfs mounts, and
  rootless user namespace modes. On SELinux systems, mounted devices and bind
  mounts may require explicit labeling choices.
- ROCm containers require the host AMD GPU driver stack to be installed. AMD's
  container guidance exposes GPUs with `/dev/kfd` plus `/dev/dri`, commonly with
  `--security-opt seccomp=unconfined`, and verifies access using `rocminfo` and
  `amd-smi list` inside the container.
- TRL `SFTTrainer` supports standard text, prompt-completion, conversational,
  and tool-calling datasets. It supports PEFT adapters, assistant-only loss,
  completion-only loss, packing, and model initialization kwargs.
- Axolotl provides a YAML-driven fine-tuning pipeline with LoRA, QLoRA, SFT,
  preference tuning, dataset preprocessing, Docker images, and current support
  for Qwen-family models including Qwen3 Next. Its Qwen3 Next guide reports
  QLoRA examples that require roughly 47 GiB VRAM without target experts and
  roughly 71 GiB VRAM with target experts, so those models are stretch targets
  for this workstation rather than the first implementation target.
- Qwen2.5-Coder provides Apache-2.0 code models in multiple sizes. The 1.5B
  base model is a practical fast-completion candidate; the 7B Instruct model is
  a practical local coding-agent candidate with long-context support and broad
  code-agent positioning.
- StarCoder2-3B is trained for code generation with fill-in-the-middle behavior
  and a 16K token context window. It is a strong alternative for a dedicated
  autocomplete model, but its BigCode OpenRAIL-M license must be reviewed
  before adopting it as the default artifact.
- Lemonade Server is already installed on the root Strix Halo system. It should
  be treated as the default local serving integration point for smoke tests,
  latency benchmarks, and repository-agent experiments before adding a second
  inference server.

## Goals

Create a repository automation system with specialized local models and
deterministic workflows for four operating modes:

1. Fast autocomplete model
   - Purpose: low-latency inline completions and fill-in-the-middle edits.
   - Preferred starting candidates: `Qwen/Qwen2.5-Coder-1.5B` or
     `bigcode/starcoder2-3b`.
   - Training objective: repository-specific continued pretraining and FIM-style
     examples where supported.
   - Output: adapter plus merged/quantized inference artifact for Lemonade
     Server or the final editor completion runtime.

2. Coding agent model
   - Purpose: repo-aware planning, edits, command selection, package-boundary
     reasoning, and test-fix loops.
   - Preferred starting candidate: `Qwen/Qwen2.5-Coder-7B-Instruct`.
   - Stretch candidates: newer Qwen coder families or Qwen3 Next variants only
     after ROCm memory behavior is measured on the target workstation.
   - Training objective: SFT on repository tasks, tool-use transcripts, review
     examples, and architecture-grounded Q&A.
   - Output: PEFT adapter first; merged and quantized artifact only after evals
     show improvement over the base model.

3. Documentation alignment automation
   - Purpose: detect drift between `README.md`, `STRUCTURE.md`, `API.md`, ADRs,
     package manifests, Moon config, exported APIs, and current filesystem
     structure.
   - Training objective: optional SFT only after deterministic checks can produce
     reliable examples of stale docs and proposed patches.
   - Output: repo task that reports drift, suggests doc patches, and validates
     changed docs against current package layout.

4. Code-review and maintenance automation
   - Purpose: identify regressions, missing tests, dependency-boundary
     violations, security-sensitive changes, stale generated artifacts, and
     validation gaps.
   - Training objective: SFT on real review examples and held-out diffs after
     rule-based review checks exist.
   - Output: review assistant that produces findings first, names affected
     files, suggests targeted tests, and avoids broad refactors unless requested.

The system should manage the repository through a layered loop:

1. Observe current state with parsers, Moon, pnpm, GitNexus, TypeScript, Biome,
   tests, and docs scanners.
2. Retrieve relevant source, docs, dependency graph, and validation history.
3. Ask a local model for a plan, review, completion, or patch proposal.
4. Apply deterministic safety filters for secrets, package boundaries, and
   generated-file exclusions.
5. Validate with repo commands and eval harnesses.
6. Feed accepted examples back into datasets only after review.

## Non-Goals

- Do not full-fine-tune large models locally in the first phase.
- Do not train on secrets, private keys, `.env` files, build caches, generated
  dependency folders, or deployment artifacts.
- Do not train on sibling repositories unless they are explicitly imported into
  a curated dataset with license and ownership review.
- Do not introduce a runtime dependency on the old `devkit-workspace` backend or
  DEX surfaces.
- Do not allow a model to directly publish, deploy, rotate secrets, or commit
  without an explicit human approval gate.
- Do not treat generated model output as a source of truth. The current
  repository, validation commands, and documented architecture remain the source
  of truth.

## Proposed Pipeline

### Phase 0: Host Capability Baseline

Confirm the Fedora 43 host can run the required container and GPU stack.

- Verify Podman rootless operation.
- Verify Toolbx can enter a Fedora 43 development shell with this repository
  mounted.
- Verify ROCm visibility on the host and inside a Podman container:
  - `/dev/kfd`
  - `/dev/dri/renderD*`
  - `rocminfo`
  - `amd-smi list`
- Verify Lemonade Server is reachable from the developer shell and from the
  repository automation container.
- Record Lemonade Server model inventory, context windows, supported APIs,
  quantization formats, and throughput on the Strix Halo system.
- Measure available effective training memory separately from total unified RAM.
- Record baseline throughput for inference on 1.5B, 3B, and 7B models before any
  fine-tuning.

### Phase 1: Repository Corpus Builder

Generate a clean corpus from this repository only.

Inputs:

- Source files from `repos/cfx-*`, `projects/*`, `tools/*`, and selected root
  configuration files.
- Markdown docs from `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, ADRs,
  package `README.md`, `STRUCTURE.md`, and `API.md` files.
- Package manifests, Moon config, pnpm workspace metadata, and devcontainer
  metadata.

Exclusions:

- `node_modules`, `dist`, coverage, caches, generated API output, lockfile-only
  chunks unless needed for package-manager reasoning, `.cfxdevkit`, `.env*`,
  keystores, deployments, crash logs, and binary assets.

Outputs:

- `corpus/files.jsonl`: file-level metadata, path, package, tier, language,
  license status, hash.
- `corpus/chunks.jsonl`: syntax-aware chunks with surrounding imports, exports,
  doc headings, and package ownership tags.
- `corpus/symbols.jsonl`: symbol and API summaries generated from TypeScript AST
  and package documentation.
- `corpus/architecture.jsonl`: architecture rules, dependency boundaries, and
  package placement decisions.
- `corpus/docs-index.jsonl`: documentation pages, headings, described package
  paths, referenced commands, and links to source files.
- `corpus/validation.jsonl`: known validation commands, project task mappings,
  and expected outputs or failure classes.

### Phase 1A: Deterministic Automation Baseline

Build automation that improves the repository before any adapter is trained.

Documentation alignment checks:

- Verify `README.md`, package `README.md`, `STRUCTURE.md`, `API.md`, and ADR
  references point to paths that exist in the current workspace.
- Compare package exports, `vite.config.ts` lib entries, and `API.md` claims.
- Check Moon project registration against `pnpm-workspace.yaml` and package
  manifests.
- Report planned/future folders separately from current-state instructions so
  agents do not apply future topology by mistake.

Code-review checks:

- Detect edits to security-sensitive surfaces such as keystore, wallet, VS Code
  extension, MCP tools, release workflows, and infrastructure secrets policy.
- Suggest validation commands based on touched packages and changed task graph.
- Require secret-leak checks for mnemonic, private-key, passphrase, keystore,
  release, and audit-log changes.
- Use GitNexus impact output as review context where available.

Completion and agent support:

- Generate retrieval packs for the active file, package, tests, docs, and nearest
  architecture rules.
- Build prompt templates for completion, review, doc alignment, and patch plans.
- Smoke-test prompts against Lemonade Server before training any adapter.

### Phase 2: Dataset Generation

Build separate datasets for completion and agent behavior.

Autocomplete dataset:

- Plain next-token code samples.
- Fill-in-the-middle samples using prefix, middle, suffix fields.
- Import-aware examples that preserve local package boundaries.
- Small edit-completion examples from real diffs, excluding noisy formatting-only
  changes.

Agent dataset:

- Conversational examples derived from repo docs: placement questions,
  architecture rules, package ownership, setup workflows.
- Tool-call-style examples for reading files, running typecheck/lint/test, and
  summarizing results.
- Patch-planning examples based on real commits and diffs.
- Code-review examples that identify regressions, missing tests, dependency
  boundary violations, and documentation drift.
- VS Code extension and devcontainer workflows, especially the new
  `repos/cfx-tools/packages/vscode-extension` surface.
- Documentation-alignment examples where the answer must distinguish current
  repository structure from planned topology.
- Maintenance examples that choose between root validation, package-scoped
  validation, GitNexus analysis, and security checks.

Evaluation dataset:

- Held-out tasks from changed files and package docs.
- Synthetic tasks that require respecting the `repos/cfx-*` architecture.
- Completion benchmarks that mask function bodies or imports from this repo.
- Agent benchmarks that require choosing the correct package, proposing a patch,
  and naming the expected validation commands.
- Documentation benchmarks that mask package paths, scripts, exports, and task
  names in docs and require reconstructing them from the current repo.
- Review benchmarks over held-out diffs that include one real issue plus noisy
  formatting or generated-output changes.

### Phase 3: Training Strategy

Start with adapters and small context windows, then scale only if evaluations
justify it.

Autocomplete track:

- Candidate A: Qwen2.5-Coder-1.5B base with LoRA/continued pretraining.
- Candidate B: StarCoder2-3B with FIM-oriented data, pending license review.
- Initial sequence length: 4K to 8K.
- Objective: completion/FIM, not chat.
- Expected deployment: local quantized model for editor completion.

Agent track:

- Candidate A: Qwen2.5-Coder-7B-Instruct with SFT + PEFT adapter.
- Candidate B: newer Qwen coder instruct model if it fits memory and license
  requirements better at implementation time.
- Initial sequence length: 8K, with later 16K/32K experiments only after memory
  profiling.
- Objective: conversational SFT with assistant-only loss; include tool-call data
  once the dataset schema is stable.
- Expected deployment: local quantized model for repo-aware coding assistant use.

Documentation and review track:

- Start without fine-tuning: deterministic scanners plus retrieval into the best
  local Lemonade Server model.
- Add SFT only when accepted doc-review and code-review examples accumulate.
- Keep review output schema stable: severity, file, issue, evidence, suggested
  validation, and confidence.
- Prefer smaller high-precision adapters over one broad model that tries to do
  completion, review, and documentation alignment with the same behavior.

Stretch track:

- Qwen3 Next or larger MoE coder models should be evaluated only after the local
  ROCm stack is proven. Use Axolotl examples as a reference, but treat reported
  47 GiB to 71 GiB VRAM requirements as a warning that these are not first-pass
  local training targets.

### Phase 4: Runtime and Container Architecture

Use Fedora 43 Toolbx for daily repo work and Podman ROCm containers for training
experiments.

Recommended separation:

- Toolbx container: dataset generation, lint/typecheck/test, JSONL validation,
  local eval harness, documentation work, and Lemonade Server client smoke tests.
- Podman ROCm training container: PyTorch, ROCm, TRL/Axolotl, model downloads,
  adapter training.
- Local inference: Lemonade Server on the Strix Halo host is the default serving
  target for first-pass experiments.
- Optional inference container: llama.cpp, vLLM-on-ROCm if viable, or
  Transformers server only if Lemonade Server cannot serve a required model or
  adapter format.

Repository automation services:

- `llm:corpus`: build corpus metadata and chunks.
- `llm:datasets`: generate train/eval JSONL datasets from approved corpus and
  examples.
- `llm:eval`: run completion, review, doc-alignment, and agent-task benchmarks.
- `llm:review`: produce a review report for current changes using retrieval and
  the selected local model.
- `llm:docs`: detect documentation drift and propose patches.
- `llm:serve-check`: verify Lemonade Server reachability and model inventory.

Initial implementation status:

- `scripts/llm-agents.mjs` implements the first deterministic upkeep agents.
- `pnpm run llm:corpus` writes file, chunk, and documentation-heading metadata
  under `artifacts/llm/corpus/`.
- `pnpm run llm:docs` checks Markdown path references, package export coverage,
  Moon project registration, and current-vs-planned structure language.
- `pnpm run llm:review` inspects uncommitted changes, flags security-sensitive
  surfaces, and suggests validation commands.
- `pnpm run llm:datasets` creates deterministic evaluation seed examples only;
  it is not a fine-tuning dataset promotion step.
- `pnpm run llm:eval` summarizes deterministic gates from the generated reports.
- `pnpm run llm:serve-check` probes Lemonade Server from `LEMONADE_URL`, then
  auto-discovers common local and devcontainer host endpoints including
  `http://localhost:13305/`, `http://host.docker.internal:13305/`, and
  `http://host.containers.internal:13305/`, and records model inventory without
  starting training.
- `pnpm run llm:models`, `pnpm run llm:config`, `pnpm run llm:ask`, and
  `pnpm run llm:action -- <action>` provide a simple Lemonade-backed CLI for
  model discovery, per-action model configuration, and repo-specific actions.
- `pnpm run llm:all` runs the full no-training upkeep loop.
- Fine-tuning remains intentionally unimplemented until these agents produce
  useful reports and eval evidence.

Storage layout:

- `artifacts/llm/corpus/` for generated corpus files.
- `artifacts/llm/datasets/` for train/eval JSONL.
- `artifacts/llm/runs/` for trainer outputs.
- `artifacts/llm/models/` for merged/quantized outputs.
- `artifacts/llm/reports/` for evals, model cards, review reports, and local
  runtime profiles.
- Keep all of the above ignored by git unless a small manifest or dataset card
  is intentionally committed.

### Phase 5: Evaluation Gates

No adapter should be promoted without repo-specific evals.

Autocomplete gates:

- Exact-match and edit-distance on masked repository snippets.
- Import correctness and package-boundary correctness.
- Latency target on the Strix Halo system.
- Regression check against the base model on general code snippets.

Agent gates:

- Answers architecture placement questions correctly.
- Chooses validation commands matching this repo: `pnpm run lint`,
  `pnpm run typecheck`, `pnpm exec moon run :test --concurrency 4`,
  package-scoped `pnpm --filter ...` commands, and GitNexus refresh where
  relevant.
- Produces patches that pass typecheck/lint on held-out tasks.
- Avoids inventing packages or future-state folders when current `repos/cfx-*`
  paths are required.
- Refuses or redacts secret-like material in generated examples.

Documentation alignment gates:

- Finds stale package paths, task names, exported symbols, and current/future
  structure drift.
- Proposes minimal doc patches that preserve planned-topology notes only when
  clearly labeled as planned.
- Does not rewrite ADR history except by adding superseding notes or new ADRs.

Review gates:

- Prioritizes actionable findings over summaries.
- Flags security-sensitive changes that lack `security:check` evidence.
- Names targeted validation commands for the affected packages.
- Avoids false positives on formatting-only changes and generated lockfile churn.

Runtime gates:

- Lemonade Server responds from the host and from the automation shell.
- The selected local model fits memory with the target context window.
- Completion latency is acceptable for editor use, separately from agent latency.
- The automation can fall back to deterministic reports when no local model is
  available.

### Phase 6: Artifact Packaging

Each promoted model artifact should include:

- Base model id and revision.
- Adapter config and trainer config.
- Dataset manifest with file hashes, filters, and exclusion rules.
- Evaluation report.
- License review notes.
- Quantization recipe.
- Runtime profile on the target Strix Halo/Fedora 43 system.
- Lemonade Server compatibility notes: model format, load command or inventory
  id, context window, quantization, throughput, and known limitations.

## Recommended First Implementation Slice

When implementation begins, keep the first slice small:

1. Add `.gitignore` rules for `artifacts/llm/` and commit only small schemas,
   manifests, and reports that are safe for source control.
2. Add a Lemonade Server reachability check that records available local models,
   context limits, and a tiny prompt/latency smoke test.
3. Build a read-only corpus generator for TypeScript, Markdown, JSON, YAML, and
   Solidity files in this repo.
4. Add a documentation alignment scanner for path references, package exports,
   Moon project registration, and current-vs-planned structure language.
5. Generate a small autocomplete JSONL dataset and a small agent/review SFT
   JSONL dataset.
6. Add validation that rejects secrets, generated folders, and files outside the
   repository root.
7. Run local inference smoke tests through Lemonade Server before any ROCm
   training.
8. Run a CPU-only trainer dry run on a tiny model to validate formatting before
   any ROCm training.
9. Run a small LoRA experiment on `Qwen/Qwen2.5-Coder-1.5B`.
10. Only then attempt the 7B agent adapter.

## Open Decisions

- Whether the autocomplete model should default to Qwen2.5-Coder-1.5B for Apache
  licensing consistency or StarCoder2-3B for stronger FIM alignment.
- Which ROCm/PyTorch version is stable on Fedora 43 for the Strix Halo GPU.
- Whether training containers should be rootless with explicit devices or
  rootful for the first ROCm experiments.
- Which model formats and adapter merge paths Lemonade Server should own versus
  a separate llama.cpp, vLLM ROCm, Transformers, or VS Code extension-integrated
  local server.
- Whether GitNexus graph output should become part of the agent dataset once the
  extraction format is stable and license/privacy rules are written down.
- Whether documentation alignment should be implemented as a Moon task, a CLI
  package under `repos/cfx-tools`, or both.
- Whether review automation should run only on demand at first or become a CI
  report once false positives are low.