# `projects/examples/packages/showcase-ui`

Shared UI primitives for the example showcase applications.

## Scope

- Reusable presentational components shared by `showcase-browser` and
  `showcase-stack`
- Example-specific styling and UI composition
- Lightweight library build for local example development

## Responsibilities

- Export UI elements from `src/index.ts`
- Build with Vite library mode into `dist/`
- Generate TypeScript declarations for the shared example surface

## Depends on

- React
- Wagmi and Viem peer integrations where needed by example UI components
- Workspace tooling from `tools/tsconfig` and `tools/biome-config`

## Commands

- `pnpm --filter @cfxdevkit/example-showcase-ui build`
- `pnpm --filter @cfxdevkit/example-showcase-ui typecheck`
- `pnpm --filter @cfxdevkit/example-showcase-ui lint`