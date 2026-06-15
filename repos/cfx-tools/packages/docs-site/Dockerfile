FROM node:24-bookworm-slim AS builder

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY . .

RUN pnpm install --frozen-lockfile

# Build workspace-utils dependency for docs-pipeline
RUN pnpm --filter @cfxdevkit/workspace-utils run build

# Run docs-pipeline content prep explicitly before building the docs renderer.
RUN pnpm --filter @cfxdevkit/docs-pipeline run docs -- sync all

# Run next build from the package directory so Next.js/Turbopack can locate
# the 'next' package via local node_modules (avoids workspace root confusion)
WORKDIR /app/repos/cfx-tools/packages/docs-site
RUN NEXT_TELEMETRY_DISABLED=1 pnpm exec next build

FROM node:24-bookworm-slim AS runner

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NODE_ENV=production \
    PORT=3100
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/repos/cfx-tools/packages/docs-site/node_modules ./node_modules
COPY --from=builder /app/repos/cfx-tools/packages/docs-site ./repos/cfx-tools/packages/docs-site

WORKDIR /app/repos/cfx-tools/packages/docs-site

EXPOSE 3100

CMD ["pnpm", "start"]