# `projects/examples/packages/showcase-ui`

Shared theme, shell, backend controls, and wallet UI primitives for the example showcase applications.

## Scope

- Reusable presentational components shared by the showcase apps
- Shared theme tokens consumed from `@cfxdevkit/theme/css` for the common showcase visual system
- Shared shell helpers for top navigation, panel sidebars, and panel state
- Shared backend/devnode operations hook and local control panel
- Example-specific styling and UI composition
- Lightweight library build for local example development

## Responsibilities

- Export UI elements from `src/index.ts`
- Re-export theme-aware UI primitives for app-level composition
- Build with Vite library mode into `dist/`
- Generate TypeScript declarations for the shared example surface

## Shared shell APIs

- `Shell` provides the common application frame for the keeper showcases.
- `PanelSidebar` renders grouped panel navigation using each app's registry.
- `useActivePanelState` persists `?panel=` and `localStorage` state consistently.
- `useShowcaseBackend` exposes backend health and devnode controls where an app still needs them.

## Depends on

- React
- Wagmi and Viem peer integrations where needed by example UI components
- Workspace tooling from `repos/cfx-config/packages/tsconfig` and `repos/cfx-config/packages/biome-config`

## Commands

- `pnpm --filter @cfxdevkit/example-showcase-ui build`
- `pnpm --filter @cfxdevkit/example-showcase-ui typecheck`
- `pnpm --filter @cfxdevkit/example-showcase-ui lint`