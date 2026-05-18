# June 2026 DevKit Migration Plan

This document is the planned-work evidence document for the June 2026 QMS planned-task row. It continues from the May 2026 legacy migration audit and completed-work summary.

## Objective

Complete the next migration phase by closing the highest-value legacy parity gaps, preparing the framework for reliable release workflows, and strengthening GitNexus/LLM automation so both local and cloud models can manage the repository with less context loading and better codebase understanding.

## Planned Work

### 1. Local DEX and Swappi parity

- Review the legacy local DEX/Swappi implementation and classify which pieces belong in examples, domain packages, or devnode support.
- Rebuild the reusable pieces as typed framework modules instead of direct legacy copies.
- Add or update tests for DEX routes, hooks, and example workflows.
- Document remaining limitations if any legacy behavior is intentionally not ported.

Expected evidence:

- Updated package code under the appropriate `repos/cfx-*` or `projects/examples` location.
- Tests or smoke coverage for the migrated behavior.
- Documentation notes linked from the migration audit or project README.

### 2. Scaffold and template parity

- Compare legacy scaffold templates with `create-cfxdevkit` templates.
- Fill the most useful missing project targets and remove obsolete template assumptions.
- Verify generated projects install, build, and run with the current workspace conventions.

Expected evidence:

- Updated template files under `repos/cfx-tools/packages/create-cfxdevkit/`.
- Template validation commands or tests.
- Updated docs describing supported targets.

### 3. Release readiness and native dependency policy

- Continue package metadata cleanup for publishable packages.
- Validate declaration files, export maps, and package boundaries before release.
- Recheck native dependency policy after the `better-sqlite3` Node 24 work to avoid duplicate or conflicting pnpm build-script settings.
- Keep CI green across build, lint, typecheck, and test tasks.

Expected evidence:

- CI run references.
- Package metadata diffs.
- Release notes or Changesets where needed.

### 4. CAS migration and project documentation

- Continue CAS documentation and migration cleanup.
- Record which legacy CAS behaviors are fully migrated, intentionally changed, or deferred.
- Keep project-level README, STRUCTURE, CHANGELOG, and AUDITS files aligned.

Expected evidence:

- Updated `projects/cas/` docs and code.
- Cross-links from the migration audit or QMS evidence docs.

### 5. GitNexus and LLM repository intelligence expansion

- Refresh GitNexus analysis after structural changes so symbols, relationships, and execution flows stay accurate.
- Expand local LLM corpus and reports for newly migrated areas.
- Improve agent-facing instructions so local models can navigate the monorepo using indexed code intelligence rather than broad file scans.
- Document how GitNexus, architecture rules, OpenSpec artifacts, and LLM corpus files reduce token usage for cloud models and improve repository comprehension as the codebase grows.

Expected evidence:

- Updated `artifacts/llm/` corpus or reports.
- Updated `docs/llm-automation-agents.md` or related LLM docs.
- GitNexus analysis or detected-change summaries after migration work.

### 6. OpenHands and browser IDE decision

- Compare legacy OpenHands and target/code-server workflows against the current devcontainer, GitNexus, and LLM automation model.
- Decide whether to port, replace, or retire the old workflows.
- Record the decision and any follow-up tasks in docs.

Expected evidence:

- Decision note or ADR-style documentation.
- Updated migration audit if work is deferred or retired.

## Acceptance Criteria

- New or migrated features are represented in the current repository structure, not only in legacy folders.
- CI remains successful after the migration work.
- Each completed area has a verifiable code path, documentation path, test path, or commit reference.
- GitNexus and LLM artifacts are refreshed or updated where repository structure changes.
- Remaining gaps are explicitly documented rather than hidden.

## Planned Timeline

- Proposed date: 15/5/2026
- Start date: 15/5/2026
- Finish date: 15/6/2026
- Reporting period: June 2026
