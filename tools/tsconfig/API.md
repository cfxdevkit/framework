# `@cfxdevkit/tsconfig` — API Reference

> Config-only package. The public API consists of the exported JSON presets, each defining a TypeScript configuration profile for specific use cases.

## Files

- `base.json` — common TypeScript defaults shared by the workspace
- `lib.json` — library preset for reusable packages
- `app-web.json` — browser application preset
- `app-node.json` — Node-targeted application preset

## Usage

```json
{
  "extends": "@cfxdevkit/tsconfig/lib.json"
}
```