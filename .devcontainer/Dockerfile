# syntax=docker/dockerfile:1.7

FROM mcr.microsoft.com/devcontainers/typescript-node:dev-24-bookworm

ARG DEBIAN_FRONTEND=noninteractive
ARG NODE_VERSION=24.15.0

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
    ripgrep \
    unzip \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/local/share/nvm/.cache \
  && chmod 2775 /usr/local/share/nvm/.cache \
  && bash -c '. /usr/local/share/nvm/nvm.sh \
    && nvm install "${NODE_VERSION}" \
    && nvm alias default "${NODE_VERSION}" \
    && ln -sfn "/usr/local/share/nvm/versions/node/v${NODE_VERSION}" /usr/local/share/nvm/current \
    && node --version | grep -x "v${NODE_VERSION}"'

# Prepend nvm/current/bin so it wins over the base image's hardcoded versioned path
ENV PATH=/usr/local/share/nvm/current/bin:${PATH}

ENV PNPM_HOME=/home/node/.local/share/pnpm
ENV PNPM_STORE_PATH=/home/node/.local/share/pnpm/store
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable \
  && corepack prepare pnpm@10.33.2 --activate \
  && npm cache clean --force \
  && mkdir -p /home/node/.local/share/pnpm/store /home/node/.cache/moon /home/node/.cfxdevkit \
  && chown -R node:node /home/node/.local /home/node/.cache /home/node/.cfxdevkit

USER node

# Install moon via native installer so `moon upgrade` works (~/.moon is the required location)
RUN curl -fsSL https://moonrepo.dev/install/moon.sh | bash

ENV PATH=/home/node/.moon:${PATH}

RUN pnpm config set store-dir /home/node/.local/share/pnpm/store

WORKDIR /workspaces/root