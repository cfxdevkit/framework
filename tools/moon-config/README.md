# `tools/moon-config`

Reusable Moon configuration templates for the workspace.

## Scope

- Shared task templates used by workspace projects
- Consistent task defaults for lint, typecheck, test, build, and clean flows
- Centralized Moon config that supports the modular `repos/cfx-*` layout

## Usage

Projects import templates from `templates/` so task conventions stay consistent
across the repository.