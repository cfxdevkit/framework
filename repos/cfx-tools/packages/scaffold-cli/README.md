# @cfxdevkit/create

**Scope:** Project generator. `npx @cfxdevkit/create <template>`.

**Responsibilities**
- Template discovery from [`../../templates/`](../../templates/)
- Variable substitution using `{{ variable }}` syntax
- Post-install setup (runs `pnpm install`, `git init`, and creates `.env` if present in template)
- Optional integrations (wallet, MCP, devcontainer) via template-specific hooks

## Install

```bash
pnpm add -D @cfxdevkit/create
```

## Usage

```bash
npx @cfxdevkit/create <template-name> [project-dir]
```

If `project-dir` is omitted, defaults to `<template-name>`.

## API Reference

### `.`

| Symbol | Description |
|--------|-------------|
| `scaffoldProject` | Main entry point. Accepts `projectName` and `options` (`name`, `description?`). |
| `parseArgs` | Parses CLI arguments into `{ name, description? }`. |
| `validateName` | Validates project name against npm naming rules. |
| `getTemplate` | Fetches a template definition by name. |
| `listTemplates` | Lists all available templates. |
| `getTemplateFiles` | Returns files to be generated for a given template and optional target (e.g., `"client"`, `"server"`). |
| `renderFile` | Renders a template file with variable substitution. |
| `TemplateDefinition`, `TemplateFile`, `TemplateTarget` | Type definitions for templates and their structure. |

### `./templates`

Re-exports core template-related types and utilities:

| Symbol | Description |
|--------|-------------|
| `listTemplates` | Returns `TemplateDefinition[]`. |
| `getTemplate(name)` | Returns `TemplateDefinition | undefined`. |
| `renderFile(content, values)` | Substitutes `{{ key }}` placeholders in `content` with `values`. |
| `getTemplateFiles(template, target?)` | Returns `TemplateFile[]` for the given template and optional target (e.g., `"client"`, `"server"`). |
| `TemplateDefinition`, `TemplateFile`, `TemplateTarget` | Type definitions for templates and their structure. |

## Template Format

Templates are defined in `../../templates/` as directories containing:
- `template.json`: metadata (`name`, `description`, `files`, `target?`)
- `files/`: template files with `{{ variable }}` placeholders
- Optional `hooks/`: scripts executed post-scaffold (e.g., `setup-wallet.sh`, `init-mcp.sh`)

## Example

```ts
import { scaffoldProject } from '@cfxdevkit/create';

await scaffoldProject('basic', {
  name: 'my-project',
  description: 'My generated project',
});
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

<!-- readme-hash: 3e5f44181711a8bdbf829db2918d70dd571b8de74eaead5616c8de3fa9fbace2 -->
