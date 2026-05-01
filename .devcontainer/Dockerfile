# syntax=docker/dockerfile:1.7

FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

ARG DEBIAN_FRONTEND=noninteractive
ARG NODE_VERSION=22.22.0

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    docker.io \
    git \
    jq \
    less \
    libssl-dev \
    lsof \
    make \
    openssh-client \
    pkg-config \
    procps \
    python3 \
    unzip \
    xz-utils \
  && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
  arch="$(dpkg --print-architecture)"; \
  case "$arch" in \
    amd64) node_arch="x64" ;; \
    arm64) node_arch="arm64" ;; \
    *) echo "Unsupported Node architecture: $arch" >&2; exit 1 ;; \
  esac; \
  curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${node_arch}.tar.xz" \
    -o /tmp/node.tar.xz; \
  tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 --no-same-owner; \
  rm /tmp/node.tar.xz; \
  node --version | grep -x "v${NODE_VERSION}"; \
  npm --version

ENV PNPM_HOME=/home/node/.local/share/pnpm
ENV PNPM_STORE_PATH=/home/node/.local/share/pnpm/store
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable \
  && corepack prepare pnpm@10.6.0 --activate \
  && npm install -g @moonrepo/cli@1.30.0 \
  && npm cache clean --force \
  && mkdir -p /home/node/.local/share/pnpm/store /home/node/.cache/moon /home/node/.cfxdevkit \
  && chown -R node:node /home/node/.local /home/node/.cache /home/node/.cfxdevkit

USER node

RUN pnpm config set store-dir /home/node/.local/share/pnpm/store

WORKDIR /workspaces/root