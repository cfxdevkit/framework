## Why

The project's Pi extensions are organized as a single thin re-export file (`.pi/extensions/repo-agent.ts`) with no structure for team growth, package sharing, or extension lifecycle management. Long sessions waste tokens on redundant tool results, and session state is lost on restart — requiring manual reconfiguration every cold start. The recommended `@davecodes/pi-dcp` (Dynamic Context Pruning) npm package exists but is not integrated, and the team lacks GitNexus-specific skills for impact analysis and codebase exploration.

## What Changes

- Create `repos/cfx-tools/infra/pi-extensions/` as a local npm package with a `pi` manifest, enabling team onboarding via `pi install` and ensuring extensions survive cold starts and rebuilds
- Integrate `npm:@davecodes/pi-dcp` for automatic token savings via deduplication, errored payload purge, and LLM-callable context compression
- Add a session state management extension with dirty repo guards, turn-boundary Git checkpoints, and cross-turn state persistence
- Register GitNexus and framework-check skills for the project's specific workflows
- Wire everything up in `.pi/settings.json` packages and skills arrays

## Capabilities

### New Capabilities
- `cdk-pi-extensions`: Local npm package registry for extensions and skills that enables team onboarding via `pi install` and survives cold starts
- `dynamic-context-purge`: Automatic token savings in long sessions via deduplication, errored payload purge, and LLM-callable context compression
- `session-state-management`: Git dirty-repo guards, turn-boundary checkpoints, and cross-turn state persistence that survive restarts

### Modified Capabilities
- None

## Impact

- **Affected Code**: `.pi/extensions/`, `.pi/settings.json`, `.pi/skills/`, `.pi/SETUP.md`, new `repos/cfx-tools/infra/pi-extensions/` directory
- **APIs/Dependencies**: New npm package `npm:@davecodes/pi-dcp`, extension API hooks (`session_start`, `tool_call`, `session_before_switch`, `before_agent_start`)
- **Systems**: Pi extension loading, session persistence, context window management
