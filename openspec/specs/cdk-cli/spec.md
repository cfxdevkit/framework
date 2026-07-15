# cdk-cli Specification

## Purpose
TBD - created by archiving change cli-redesign. Update Purpose after archive.
## Requirements
### Requirement: Remove Repository Namespace From cdk
The `cdk` CLI MUST NOT expose a `repo` namespace.

#### Scenario: User invokes removed repo namespace
- **Given** the CLI is built from the redesigned command registry
- **When** the user runs `cdk repo build`
- **Then** the CLI reports `Unknown command` for `repo`
- **And** exits with a non-zero status code

### Requirement: Remove Agent Namespace From cdk
The `cdk` CLI MUST NOT expose an `agent` namespace.

#### Scenario: User invokes removed agent namespace
- **Given** the CLI is built from the redesigned command registry
- **When** the user runs `cdk agent chat --help`
- **Then** the CLI reports `Unknown command` for `agent`
- **And** exits with a non-zero status code

### Requirement: Remove llm Namespace From cdk
The `cdk` CLI MUST NOT expose an `llm` namespace.

#### Scenario: User invokes removed llm namespace
- **Given** the CLI is built from the redesigned command registry
- **When** the user runs `cdk llm models`
- **Then** the CLI reports `Unknown command` for `llm`
- **And** exits with a non-zero status code

### Requirement: Preserve Framework Command Surface In cdk
The `cdk` CLI MUST continue to expose framework-scoped commands for build/test/lint/typecheck/check, framework docs generation/validation, contracts operations, devnode operations, signer/sign operations, mcp startup, and account utility commands.

#### Scenario: User invokes supported framework command
- **Given** the CLI is built from the redesigned command registry
- **When** the user runs a supported command such as `cdk build @cfxdevkit/tooling-cli`
- **Then** the command executes normally
- **And** exits with status code `0` on success

### Requirement: Keep Existing Package And Binary Identity
The package identity for this CLI MUST remain `@cfxdevkit/tooling-cli` and the executable name MUST remain `cdk`.

#### Scenario: Package metadata and executable remain stable
- **Given** the package manifests and build outputs are generated
- **When** maintainers inspect package metadata and executable entry points
- **Then** the package name remains `@cfxdevkit/tooling-cli`
- **And** the executable remains available as `cdk`

