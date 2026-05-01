# syntax=docker/dockerfile:1.7

FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

ARG DEBIAN_FRONTEND=noninteractive

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

ENV PNPM_HOME=/usr/local/share/pnpm
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