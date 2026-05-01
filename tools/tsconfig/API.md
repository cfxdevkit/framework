# `@cfxdevkit/tsconfig` — API Reference

> Config-only package. The public API is the set of exported JSON presets.

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