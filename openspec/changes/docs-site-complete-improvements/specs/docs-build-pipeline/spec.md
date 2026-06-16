## ADDED Requirements

### REQ 5.1: Content Verification Step
The docs-site Dockerfile MUST include a content verification step that runs after `sync all` and before `next build`.

The verification script (`scripts/verify-content.mjs`) MUST check:
- `content/releases.mdx` exists (or warn if missing)
- `content/guides/index.mdx` exists (or warn if missing)
- `content/api.mdx` exists (or warn if missing)
- `content/quickstart.mdx` exists (required)
- At least 25 package pages exist in `content/packages/`

The Docker build MUST fail if:
- `content/quickstart.mdx` is missing
- Fewer than 20 package pages exist

### REQ 5.2: Coverage Data Pre-Step
The `.github/workflows/build-docs.yml` workflow MUST run `pnpm test:coverage` for all publishable packages before `sync all` generates the coverage page.

The coverage step MUST:
- Run before the `Sync wiki content` step
- Use `pnpm --filter "@cfxdevkit/*" test:coverage`
- Continue on error (some packages may not have coverage tests)
- Use `--concurrency 4` to speed up execution

### REQ 5.3: Quickstart Expansion
The `content/quickstart.mdx` page MUST include a "Next packages to try" section that links to:
- `@cfxdevkit/executor` (safe multi-step transaction sequencing)
- `@cfxdevkit/react` (React hooks for balances and tokens)
- `@cfxdevkit/wallet-connect` (ConnectKit wagmi integration)
- `@cfxdevkit/devnode` (local Conflux node for testing)

### REQ 5.4: Docker Build Image Tags
The Docker image build MUST continue to support all existing tags:
- `edge` (on main branch)
- `dev` (on dev branch)
- `latest` (on main branch)
- `sha` (short format)
