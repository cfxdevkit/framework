FROM node:24-bookworm-slim AS builder

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY . .

RUN pnpm install --frozen-lockfile --filter @cfxdevkit/docs-site...
RUN pnpm --filter @cfxdevkit/docs-site build

FROM node:24-bookworm-slim AS runner

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NODE_ENV=production \
    PORT=3100
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/repos/cfx-tools/packages/docs-site ./repos/cfx-tools/packages/docs-site

WORKDIR /app/repos/cfx-tools/packages/docs-site

EXPOSE 3100

CMD ["pnpm", "start"]