# Vercel Setup for docs-site

The docs-site is a Next.js + Nextra app nested in a pnpm monorepo. Vercel needs specific configuration to handle the workspace dependencies.

## Steps

1. **Go to Vercel Dashboard** → Import or connect this repository
2. **Project Name**: `framework-docs` (or whatever you prefer)
3. **Framework Preset**: `Next.js`
4. **Root Directory**: `repos/cfx-tools/packages/docs-site`
5. **Build and Output Settings** (click "Advanced" → "Build and Output Settings"):

| Setting | Value |
|---------|-------|
| **Install Command** | `GIT_ROOT=$(git rev-parse --show-toplevel) && cd "$GIT_ROOT" && pnpm install --frozen-lockfile` |
| **Build Command** | `GIT_ROOT=$(git rev-parse --show-toplevel) && cd "$GIT_ROOT" && pnpm --filter @cfxdevkit/workspace-utils run build && pnpm --filter @cfxdevkit/docs-pipeline run docs -- sync all && pnpm exec next build` |
| **Output Directory** | `.next` |
| **Development Command** | `GIT_ROOT=$(git rev-parse --show-toplevel) && cd "$GIT_ROOT" && pnpm --filter @cfxdevkit/docs-site run dev` |

## Why this works

- The docs-site lives in a **pnpm monorepo** at `repos/cfx-tools/packages/docs-site/`
- It depends on workspace packages (`@cfxdevkit/docs-pipeline`, `@cfxdevkit/workspace-utils`)
- `pnpm install` must run from the **workspace root** (where `pnpm-workspace.yaml` is), not from the docs-site subdirectory
- `git rev-parse --show-toplevel` reliably finds the repo root from any subdirectory
- The build step syncs wiki/content via `docs-pipeline` before building Next.js

## Environment Variables

No special env vars needed. The site is built statically (Nextra generates static pages).

## Verification

After deploying, verify:
1. The build completes without "module not found" errors for `@cfxdevkit/` packages
2. The content sync step (`pnpm --filter @cfxdevkit/docs-pipeline run docs -- sync all`) runs successfully
3. The site serves correctly at the Vercel URL
