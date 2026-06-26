# moon-entrypoint Specification

## Purpose
TBD - created by archiving change cli-redesign. Update Purpose after archive.
## Requirements
### Requirement: Expose Repository Operation Tasks In tooling-cli Moon Project
The `tooling-cli` Moon project MUST define repository operation tasks covering build/check/generate/merge/review/precommit/commit flows.

#### Scenario: Repository operation task is executable
- **Given** Moon project configuration is loaded for `tooling-cli`
- **When** the user runs one of the repository operation tasks
- **Then** Moon resolves and executes the configured script
- **And** the task can be invoked without `cdk repo` namespace usage

### Requirement: Expose Agent and LLM Tasks In tooling-cli Moon Project
The `tooling-cli` Moon project MUST define tasks for interactive PI sessions, deterministic workflows, and exploratory workflows.

#### Scenario: Agent task delegates to package runner
- **Given** the Moon task targets are defined in `tooling-cli/moon.yml`
- **When** the user runs an agent task such as `agent-chat` or `agent-deterministic-models`
- **Then** execution delegates to `@cfxdevkit/llm-agents` and `@cfxdevkit/pi-agent` scripts
- **And** task execution succeeds when dependencies are installed

### Requirement: Expose Docs, Devnode, Signing, and Utility Tasks Through Moon
Moon task definitions MUST include docs pipeline operations, devnode lifecycle operations, signing operations, and utility tasks used by repository maintainers.

#### Scenario: Non-agent utility task executes through Moon
- **Given** the tooling Moon project includes utility tasks
- **When** a user runs a utility task such as docs validation or signer status
- **Then** Moon invokes the configured package command
- **And** the command runs without requiring legacy `cdk` namespace wrappers

### Requirement: Treat Moon As Primary Orchestration Layer
Repository-wide operations MUST be discoverable and invokable via Moon target names as the primary orchestration interface.

#### Scenario: User discovers and runs Moon targets
- **Given** maintainers use Moon as the task runner
- **When** they list or invoke target names in the `tooling-cli` project
- **Then** repository operations are accessible from Moon tasks
- **And** command routing remains centralized in Moon configuration

