## ADDED Requirements

### Requirement: Consolidate Repository Operations Under Moon Tasks
Repository-wide automation MUST be exposed through Moon tasks instead of `cdk repo` namespace commands.

#### Scenario: Developer runs repository build via Moon
- **Given** project task configuration is loaded
- **When** the developer runs `moon run tooling-cli:repo-build`
- **Then** repository build orchestration runs via Moon tasks
- **And** no `cdk repo` namespace is required

### Requirement: Consolidate LLM and Agent Workflows Under Moon Tasks
LLM and PI agent workflows MUST be invokable through Moon tasks and package scripts that delegate to `@cfxdevkit/llm-agents` and `@cfxdevkit/pi-agent` entry points.

#### Scenario: Developer launches interactive agent workflow via Moon
- **Given** task configuration references package-level agent scripts
- **When** the developer runs `moon run tooling-cli:agent-chat`
- **Then** PI-backed interactive chat starts through the package runtime
- **And** no `cdk agent` or `cdk llm` namespace is required

### Requirement: Remove Deprecated Hidden llm Commands
The redesigned command surface MUST not retain deprecated hidden `cdk llm` command aliases.

#### Scenario: Help output excludes deprecated namespaces
- **Given** the redesigned CLI build is installed
- **When** the user runs `cdk --help`
- **Then** the output does not list `llm`, `repo`, or `agent` namespaces
- **And** only supported framework command groups are shown

### Requirement: Keep Root Scripts Aligned With Moon First Entry
Root-level npm scripts for repository operations MUST call Moon tasks instead of legacy namespace forwarding.

#### Scenario: Root script delegates to namespaced moon target
- **Given** root package scripts are configured for the redesign
- **When** a user runs `pnpm run repo:check`
- **Then** the script delegates to a Moon task target
- **And** the operation executes without invoking `cdk repo check`
