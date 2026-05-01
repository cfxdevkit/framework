# `tools/tsconfig`

Shared TypeScript configuration presets for the workspace.

## Scope

- Base compiler settings shared across packages and apps
- Presets for libraries, browser apps, and Node-targeted applications
- Centralized defaults so `repos/cfx-*` and `projects/*` use the same TS rules

## Files

- `base.json` — common strict TypeScript defaults
- `lib.json` — library-oriented settings
- `app-web.json` — browser application settings
- `app-node.json` — Node application settings

## Usage

Packages extend these configs from their local `tsconfig.json` rather than
copying compiler options inline.