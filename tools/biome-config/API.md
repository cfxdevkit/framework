# `@cfxdevkit/biome-config` — API Reference

> Config-only package. The public API is the shared `biome.json` preset.

## Files

- `biome.json` — workspace formatter and linter configuration extended by local packages

## Usage

Packages extend this config from their local Biome settings rather than copying
the rule set inline.