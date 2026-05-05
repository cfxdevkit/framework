# `projects/examples/packages/showcase-ui`

Shared theme, shell, backend controls, and wallet UI primitives for the example showcase applications.

## Scope

- Reusable presentational components shared by the showcase apps
- Shared `theme.css` imported by every app for the common showcase visual system
- Shared gateway/shell helpers for top navigation, panel sidebars, and panel state
- Shared backend/devnode operations hook and gateway control panel
- Example-specific styling and UI composition
- Lightweight library build for local example development

## Responsibilities

- Export UI elements from `src/index.ts`
- Export `./theme.css` for app-level CSS imports
- Build with Vite library mode into `dist/`
- Generate TypeScript declarations for the shared example surface

## Shared shell APIs

- `ShowcaseNav` keeps every app connected to the gateway and sibling sections.
- `PanelSidebar` renders grouped panel navigation using each app's registry.
- `useActivePanelState` persists `?panel=` and `localStorage` state consistently.
- `ShowcaseOpsPanel` and `useShowcaseBackend` expose backend health and devnode controls.

## Depends on

- React
- Wagmi and Viem peer integrations where needed by example UI components
- Workspace tooling from `tools/tsconfig` and `tools/biome-config`

## Commands

- `pnpm --filter @cfxdevkit/example-showcase-ui build`
- `pnpm --filter @cfxdevkit/example-showcase-ui typecheck`
- `pnpm --filter @cfxdevkit/example-showcase-ui lint`