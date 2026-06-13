import { PROJECT_EXAMPLE_CONFIG_FILES } from './project-example/config.js';
import { PROJECT_EXAMPLE_CORE_FILES } from './project-example/core.js';
import { PROJECT_EXAMPLE_SCRIPT_FILES } from './project-example/scripts.js';
import type { TemplateDefinition } from './types.js';

export const PROJECT_EXAMPLE: TemplateDefinition = {
  name: 'project-example',
  description: 'Full-stack: Vite frontend + Hono backend + Solidity contracts.',
  files: [
    ...PROJECT_EXAMPLE_CORE_FILES,
    ...PROJECT_EXAMPLE_CONFIG_FILES,
    ...PROJECT_EXAMPLE_SCRIPT_FILES,
  ],
  targets: {
    devcontainer: [
      {
        path: '.devcontainer/devcontainer.json',
        content: `{
  "name": "{{name}}",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-22",
  "customizations": {
    "vscode": {
      "extensions": ["esbenp.prettier-vscode", "biomejs.biome", "GitHub.copilot"]
    }
  },
  "forwardPorts": [5173, 3000],
  "containerEnv": {
    "CFXDEVKIT_INSTALL_PI_GITNEXUS": "0"
  },
  "postCreateCommand": "npm install && (command -v openspec >/dev/null 2>&1 && [ -d openspec ] && [ ! -f .pi/skills/openspec-propose/SKILL.md ] && openspec init --tools pi || true) && (command -v pi >/dev/null 2>&1 && [ "$CFXDEVKIT_INSTALL_PI_GITNEXUS" = "1" ] && pi install npm:pi-gitnexus || true)"
}
`,
      },
    ],
    docker: [
      {
        path: 'docker-compose.yml',
        content: `version: '3.9'
services:
  backend:
    build: ./packages/backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
  frontend:
    build:
      context: .
      dockerfile: packages/frontend/Dockerfile
    ports:
      - "80:80"
`,
      },
      {
        path: 'packages/frontend/Dockerfile',
        content: `FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
`,
      },
      {
        path: 'packages/backend/Dockerfile',
        content: `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
CMD ["node", "dist/server.js"]
EXPOSE 3000
`,
      },
    ],
  },
};
