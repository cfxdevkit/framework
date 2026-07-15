# @cfxdevkit/pi-customization

PI customization package for Conflux DevKit.

This package replaces the old `@cfxdevkit/pi-agent` TypeScript wrapper. It registers:

- **Commands**: `/cdk status|derive|generate|contracts`, `/repo-actions`, `/repo-check`, `/repo-commit`, `/repo-run`, `/repo-status`
- **Tools**: `repo_agent_check`, `repo_action_catalog`, `repo_run_action`, `repo_commit_workflow`
- **Provider registration**: OpenAI-compatible provider pointing to `~/.pi/agent/providers.json`
- **UI widgets**: Context status, workflow progress, gate UI, commit workflow state

## Installation

Installed globally as a PI package:

```bash
pi install /workspaces/root/repos/cfx-tools/infra/pi-customization
```

## Dependencies

- `@cfxdevkit/llm-agents` — typed workflow agents (direct import)
- `@earendil-works/pi-coding-agent` — PI runtime (peer dependency)
- `@earendil-works/pi-tui` — PI TUI components (peer dependency)
- `@cfxdevkit/cli` — CDK pure functions

## Structure

```
src/
├── index.ts              ← PI extension entry point
├── extension.ts          ← Extension metadata type
├── config/               ← Config types, normalization, policy resolution
├── provider/             ← Provider bridge, types, resolution
├── commands/             ← /cdk, /repo-* command handlers
├── tools/                ← Tool executors (cdk, commit)
├── llm-agents-runtime.ts ← Interface to @cfxdevkit/llm-agents
└── ui.ts, ui-cdk.ts      ← UI state factories
```
