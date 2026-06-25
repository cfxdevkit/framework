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
    fd-find \
    git \
    jq \
    less \
    libssl-dev \
    libusb-1.0-0 \
    libusb-dev \
    lsof \
    make \
    openssh-client \
    pkg-config \
    procps \
    python3 \
    ripgrep \
    unzip \
    ffmpeg \
    yt-dlp \
  && ln -sf /usr/bin/fdfind /usr/local/bin/fd \
  && rm -rf /var/lib/apt/lists/*

# mkcert — local trusted TLS cert generation for *.dev.cfxdevkit.org
# See docs/adr/0005-local-https-reverse-proxy.md for rationale.
RUN curl -fsSL \
  "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64" \
  -o /usr/local/bin/mkcert \
  && chmod +x /usr/local/bin/mkcert

# Caddy — local reverse proxy, same config structure as VPS.
# CAP_NET_BIND_SERVICE (devcontainer.json) allows binding port 443 without root.
RUN curl -fsSL \
  "https://github.com/caddyserver/caddy/releases/download/v2.8.4/caddy_2.8.4_linux_amd64.tar.gz" \
  | tar -xz -C /usr/local/bin caddy \
  && chmod +x /usr/local/bin/caddy

# udev rule for OneKey Classic S1 (VID 1209 / PID 53c1).
# Allows non-root access when /dev/bus/usb is passed through (devcontainer.json).
RUN mkdir -p /etc/udev/rules.d \
  && echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="1209", ATTR{idProduct}=="53c1", MODE="0666", GROUP="plugdev"' \
  > /etc/udev/rules.d/70-onekey.rules

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
  && mkdir -p /home/node/.npm-global/bin /home/node/.npm-global/lib/node_modules \
  && chown -R node:node /home/node/.local /home/node/.cache /home/node/.cfxdevkit /home/node/.npm-global

# PI (Coding Agent) — installed as root so it writes to ~/.npm-global (user-writable prefix).
# Avoids the EACCES that happens when npm i -g targets root-owned /usr/local/... paths.
RUN npm i -g --ignore-scripts @earendil-works/pi-coding-agent@0.80.2 --prefix /home/node/.npm-global \
  && chown -R node:node /home/node/.npm-global

USER node

# Install moon via native installer so `moon upgrade` works (~/.moon is the required location)
RUN curl -fsSL https://moonrepo.dev/install/moon.sh | bash

# Install openspec CLI globally so it is available on PATH after container rebuild
# NOTE: npm's "openspec@latest" is a dummy placeholder (v0.0.0). The real CLI is @fission-ai/openspec.
USER root
RUN npm install -g @fission-ai/openspec@latest

# Headroom — context compression proxy between devcontainer and local LLM
# Compresses tool outputs, logs, RAG chunks before they reach the LLM (60-95% token savings)
# CPU-only torch (~250MB) — no GPU in devcontainer; inference runs on Lemonade Server
USER root
RUN apt-get update && apt-get install -y --no-install-recommends python3-venv && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/headroom
# CPU torch — small wheel, no GPU needed (headroom compresses tokens, doesn't run models)
# Pre-install typing_extensions to work around a known PyPI normalization bug in torch==2.9.1 cpu wheel
RUN /opt/headroom/bin/pip install --no-cache-dir "typing_extensions"
RUN /opt/headroom/bin/pip install --no-cache-dir "torch==2.9.1" --index-url https://download.pytorch.org/whl/cpu
RUN /opt/headroom/bin/pip install --no-cache-dir "headroom-ai[proxy,mcp,ml,code]"
ENV PATH=/opt/headroom/bin:${PATH}
USER node

ENV PATH=/home/node/.npm-global/bin:/home/node/.moon:${PATH}

# pi-web-access is installed by post-start.sh (and post-create.sh for first boot)
# See post-start.sh for the install + symlink logic

RUN pnpm config set store-dir /home/node/.local/share/pnpm/store

WORKDIR /workspaces/root