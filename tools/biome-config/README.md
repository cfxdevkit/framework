# `tools/biome-config`

Shared Biome configuration for the repository.

## Scope

- Formatting and lint rules used across `repos/cfx-*`, `projects/*`, and `tools/*`
- Common defaults for Markdown, TypeScript, and workspace-wide style checks
- A single config entrypoint that packages extend instead of redefining locally

## Usage

Workspace packages reference this package as `@cfxdevkit/biome-config` and
extend its `biome.json` from their local Biome configuration.