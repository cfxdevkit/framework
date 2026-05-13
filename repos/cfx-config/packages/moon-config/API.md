# `@cfxdevkit/moon-config` — API Reference

> Config-only package. The public API is the set of reusable Moon templates.

## Templates

- `templates/library.yml` — shared library task template used by workspace packages to enforce consistent build, lint, typecheck, test, and clean conventions

## Usage

Workspace projects import templates from this package so build, lint, typecheck,
test, and clean conventions stay consistent.