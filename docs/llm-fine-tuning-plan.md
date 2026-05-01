# Repository-Centered LLM Fine-Tuning Plan

This document is a planning artifact only. It describes how this repository can
produce datasets, evaluations, and adapter artifacts for local coding-assistant
models. It does not define implementation scripts, training configs, or CI jobs
yet.

## Target System

The primary local target is a Strix Halo system:

- CPU/APU: AMD Ryzen AI Max+ 395
- Memory: 128 GB unified system memory
- Host OS: Fedora 43
- Container runtime: Podman
- Interactive development shell: Toolbx / Toolbox containers
- Preferred isolation model: rootless Podman where possible, with explicit GPU
  device passthrough for training containers

The target should be treated as a powerful local workstation, not as a cloud GPU
cluster. The plan therefore prioritizes repository-specific adapter training,
careful dataset quality, quantized inference, and small/medium model choices
over full fine-tuning of large models.

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

## Goals

Create two repository-specialized model artifacts:

1. Fast autocomplete model
   - Purpose: low-latency inline completions and fill-in-the-middle edits.
   - Preferred starting candidates: `Qwen/Qwen2.5-Coder-1.5B` or
     `bigcode/starcoder2-3b`.
   - Training objective: repository-specific continued pretraining and FIM-style
     examples where supported.
   - Output: adapter plus merged/quantized inference artifact for local serving.

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

## Non-Goals

- Do not full-fine-tune large models locally in the first phase.
- Do not train on secrets, private keys, `.env` files, build caches, generated
  dependency folders, or deployment artifacts.
- Do not train on sibling repositories unless they are explicitly imported into
  a curated dataset with license and ownership review.
- Do not introduce a runtime dependency on the old `devkit-workspace` backend or
  DEX surfaces.

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

Evaluation dataset:

- Held-out tasks from changed files and package docs.
- Synthetic tasks that require respecting the `repos/cfx-*` architecture.
- Completion benchmarks that mask function bodies or imports from this repo.
- Agent benchmarks that require choosing the correct package, proposing a patch,
  and naming the expected validation commands.

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

Stretch track:

- Qwen3 Next or larger MoE coder models should be evaluated only after the local
  ROCm stack is proven. Use Axolotl examples as a reference, but treat reported
  47 GiB to 71 GiB VRAM requirements as a warning that these are not first-pass
  local training targets.

### Phase 4: Container Architecture

Use Fedora 43 Toolbx for daily repo work and Podman ROCm containers for training
experiments.

Recommended separation:

- Toolbx container: dataset generation, lint/typecheck/test, JSONL validation,
  local eval harness, documentation work.
- Podman ROCm training container: PyTorch, ROCm, TRL/Axolotl, model downloads,
  adapter training.
- Podman inference container: llama.cpp, vLLM-on-ROCm if viable, or Transformers
  server for adapter smoke tests.

Storage layout:

- `artifacts/llm/corpus/` for generated corpus files.
- `artifacts/llm/datasets/` for train/eval JSONL.
- `artifacts/llm/runs/` for trainer outputs.
- `artifacts/llm/models/` for merged/quantized outputs.
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
- Chooses validation commands matching this repo: `pnpm lint`, `pnpm typecheck`,
  `pnpm test`, package-scoped `pnpm --filter ...` commands, and GitNexus refresh
  where relevant.
- Produces patches that pass typecheck/lint on held-out tasks.
- Avoids inventing packages or future-state folders when current `repos/cfx-*`
  paths are required.
- Refuses or redacts secret-like material in generated examples.

### Phase 6: Artifact Packaging

Each promoted model artifact should include:

- Base model id and revision.
- Adapter config and trainer config.
- Dataset manifest with file hashes, filters, and exclusion rules.
- Evaluation report.
- License review notes.
- Quantization recipe.
- Runtime profile on the target Strix Halo/Fedora 43 system.

## Recommended First Implementation Slice

When implementation begins, keep the first slice small:

1. Add a dataset manifest schema and `.gitignore` rules for `artifacts/llm/`.
2. Build a read-only corpus generator for TypeScript, Markdown, JSON, YAML, and
   Solidity files in this repo.
3. Generate a small autocomplete JSONL dataset and a small agent SFT JSONL
   dataset.
4. Add validation that rejects secrets, generated folders, and files outside the
   repository root.
5. Run a CPU-only dry run on a tiny model to validate formatting before any ROCm
   training.
6. Run a small LoRA experiment on `Qwen/Qwen2.5-Coder-1.5B`.
7. Only then attempt the 7B agent adapter.

## Open Decisions

- Whether the autocomplete model should default to Qwen2.5-Coder-1.5B for Apache
  licensing consistency or StarCoder2-3B for stronger FIM alignment.
- Which ROCm/PyTorch version is stable on Fedora 43 for the Strix Halo GPU.
- Whether training containers should be rootless with explicit devices or
  rootful for the first ROCm experiments.
- Whether the final runtime target is llama.cpp, vLLM ROCm, Transformers, or a
  VS Code extension-integrated local server.
- Whether GitNexus graph output should become part of the agent dataset once the
  extraction format is stable and license/privacy rules are written down.