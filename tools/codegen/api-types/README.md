# tools/codegen/api-types

OpenAPI → TypeScript type sharing between backends and frontends.

> **Status:** Convention placeholder — no package.json.
>
> Projects with HTTP backends should publish an `openapi.yaml` and run a generator (e.g. [openapi-typescript](https://github.com/drwpow/openapi-typescript)) to emit a `src/generated/api.d.ts` consumed by their frontend.

## Pattern

```bash
pnpm dlx openapi-typescript ./openapi.yaml -o src/generated/api.d.ts
```

See [tools/STRUCTURE.md](../../STRUCTURE.md) for the broader codegen layout.
