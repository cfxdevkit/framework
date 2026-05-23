# @cfxdevkit/llm-tools

Local LLM automation tools for the Conflux DevKit monorepo.

This package is the CLI dispatcher for the current LLM worker layer. Provider/runtime resolution now delegates to `@cfxdevkit/pi-agent`; workflow agents live in `@cfxdevkit/llm-agents`. It lives in `repos/cfx-tools/infra/llm-tools` because local LLM and AI-assisted maintenance are isolated from the general developer tooling surface.

At the workspace root, `pnpm run cdk -- agent ...` is now the primary entrypoint. Root `pnpm run llm:*` scripts remain as compatibility shims during the migration, and `pnpm run llm:wiki` is deprecated in favor of `pnpm run docs:wiki`.

Interactive, print, and RPC agent modes now delegate to `@cfxdevkit/pi-agent` instead of launching
ad hoc worker scripts directly. The compatibility layer keeps `llm-tools` entrypoints available while
the canonical control plane stays on `cdk agent`.

## Install

```bash
pnpm add @cfxdevkit/llm-tools
```

## Commands

| Command | Purpose |
|---------|---------|
| `llm:commit` | Hardened local LLM commit pipeline with code-hotspot checks, prechecks, Changeset guidance, approval, explicit staging, and commit execution |
| `llm:docs-upkeep` | Delegate documentation maintenance recommendations to the local LLM after deterministic docs checks have produced context |
| `llm:test-audit` | Ask the local LLM whether changed code has meaningful test and precheck coverage |
| `llm:health` | Ask the local LLM to summarize repo health, drift, and automation gaps |
| `llm:validation` | Ask the local LLM to choose the minimum useful validation commands for the current change |
| `llm:changeset`, `llm:release`, `llm:ci-cd`, `llm:docs-pipeline` | Repo-aware provider-backed actions for Changesets, npm publishing, GitHub Actions, docs image publishing, and VPS deploy readiness |
| `llm:all`, `llm:review` | Compatibility aliases for aggregate and review upkeep flows; the preferred surface is `cdk agent exploratory all|review` |

PI-backed compatibility entrypoints:

| Command | Preferred surface |
|---------|-------------------|
| `pnpm --filter @cfxdevkit/llm-tools llm -- ask -- <prompt>` | `pnpm run cdk -- agent print -- <prompt>` |
| `pnpm --filter @cfxdevkit/llm-tools llm -- interactive` | `pnpm run cdk -- agent interactive` |
| `pnpm --filter @cfxdevkit/llm-tools llm -- print -- <prompt>` | `pnpm run cdk -- agent print -- <prompt>` |
| `pnpm --filter @cfxdevkit/llm-tools llm -- rpc` | `pnpm run cdk -- agent rpc` |

Root `pnpm run llm:*` scripts remain available as short compatibility commands, but new automation should target `cdk agent` directly.

Commit flows now have an explicit split:

- `pnpm run cdk -- repo commit` remains the deterministic commit pipeline for stable scripted runs.
- `pnpm run cdk -- agent commit` starts the PI-backed interactive commit session, keeps remediation in-session, and pauses at the final approval boundary.

`llm:commit` runs `check:hotspots` as a non-bypassable quality gate. The scanner applies the framework design-principles file budget across source files in the whole repository, writes `artifacts/llm/reports/code-hotspots.md`, and blocks commits while any source file exceeds the hard 300-line limit.

`llm:commit` no longer edits package changelogs directly. Changesets own version bumps and release changelogs. When publishable package changes are detected and no `.changeset/*.md` file is present, the commit pipeline can generate a draft Changeset and stage it with the commit. Use `--changeset-bump patch|minor|major` to force the bump level, or `--skip-changeset` / `--no-changeset` when the package change is intentionally unreleased.

## Release and CI/CD

`pnpm run check:ci` performs deterministic checks for the docs image workflow, VPS deploy workflow, Changesets release workflow, npm publish helper, docs Dockerfile, wiki sync script, and Ansible deployment files. It writes `artifacts/llm/reports/ci-cd.md`.

The delegated LLM actions use that deterministic report plus workflow and infrastructure context:

```bash
pnpm run llm:changeset
pnpm run llm:release
pnpm run llm:ci-cd
pnpm run llm:docs-pipeline
```

Use these after touching `.changeset/`, package manifests, `.github/workflows/`, `repos/cfx-tools/packages/docs-site/`, or `infrastructure/ansible/`.

## Docs Upkeep

`pnpm run llm:docs-upkeep` runs a four-phase documentation maintenance loop:

1. Refresh deterministic docs alignment artifacts with `check:docs`.
2. Discover markdown folder scopes across the repo.
3. Process each folder serially with bounded context from that folder plus repository docs signals.
4. Write per-folder artifacts under `artifacts/llm/reports/docs-upkeep/` and an index at `artifacts/llm/reports/docs-upkeep.md`.

Useful flags:

```bash
pnpm run llm:docs-upkeep -- --quick
pnpm run llm:docs-upkeep -- --docs-only --quick
pnpm run llm:docs-upkeep -- --scope docs/architecture --max-folders 1
pnpm run llm:docs-upkeep -- --quick --write --yes --max-folders 3
```

By default the command produces reviewable artifacts only. Add `--write` to let the local model return exact search/replace edits for existing markdown files in the current folder scope. Write mode never creates new files, skips updates outside the folder scope, and only applies replacements whose old text matches exactly once.

## Backend

Delegated commands resolve providers through the PI runtime bridge in `@cfxdevkit/pi-agent`: repo-local `.pi/providers.json`, scoped unit overlays, direct Lemonade configuration, optional LiteLLM gateway settings, OpenAI-compatible env vars, and GitHub Models via `GITHUB_TOKEN`.

For PI-backed runtime modes, `llm-tools` delegates into the same provider bridge used by `cdk agent`,
so scoped config, model selection, and repository-local `.pi` resources stay aligned across both entrypoints.

The shared PI config now supports named provider profiles plus action and phase policies.
That lets `cdk agent commit` pick a backend intentionally for the commit session while still splitting model
selection between commit-message generation and failure analysis.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 7 symbols |

---

## `.`

```ts
export type LlmWorker = 'llm' | 'deterministic';
export type LlmCommandName = (typeof llmCommands)[number]['name'];
export interface LlmCommandDefinition {
  name: LlmCommandName;
  description: string;
  worker: LlmWorker;
}
export declare const llmCommands: readonly [
  { name: 'llm:commit'; description: 'Run hardened commit pipeline with hotspot checks'; worker: 'deterministic' },
  { name: 'llm:docs-upkeep'; description: 'Delegate documentation upkeep to LLM'; worker: 'llm' },
  { name: 'llm:test-audit'; description: 'Audit test coverage of changed code'; worker: 'llm' },
  { name: 'llm:health'; description: 'Summarize repo health and automation gaps'; worker: 'llm' },
  { name: 'llm:validation'; description: 'Select minimal validation commands'; worker: 'llm' },
  { name: 'llm:changeset'; description: 'Generate or update Changesets'; worker: 'llm' },
  { name: 'llm:release'; description: 'Prepare and execute release'; worker: 'llm' },
  { name: 'llm:ci-cd'; description: 'Validate and update CI/CD workflows'; worker: 'llm' },
  { name: 'llm:docs-pipeline'; description: 'Build and deploy docs artifacts'; worker: 'llm' },
  { name: 'llm:all'; description: 'Run all repo upkeep agents'; worker: 'llm' },
  { name: 'llm:review'; description: 'Run LLM review agent'; worker: 'llm' }
];
export declare function findLlmCommand(name: string): LlmCommandDefinition | undefined;
export declare function runCli(): Promise<void>;
export declare const llmToolingNamespace: {
  name: string;
  description: string;
  usage: string;
};
```

<!-- api-hash: 7c774fb9fce0fb68e52a83c3d9b60f5fb98e14c85ca0bc4eab8b69943e070f12 -->

## Usage

```ts
import { findLlmCommand, llmCommands, runCli } from '@cfxdevkit/llm-tools';

// Find a command definition by name
const commitCmd = findLlmCommand('llm:commit');
// => { name: 'llm:commit', description: 'Run hardened commit pipeline with hotspot checks', worker: 'deterministic' }

// List all available commands
console.log(llmCommands);

// Run the CLI (typically invoked via `pnpm run llm:*`)
runCli();
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

<!-- readme-hash: 734b533cd7ee2ec6c19641221ad518c8d6eae7b9474a8453ee213ab090218f69 -->
