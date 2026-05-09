import type { TemplateDefinition } from './types.js';

export const PROJECT_EXAMPLE: TemplateDefinition = {
  name: 'project-example',
  description: 'Full-stack: Vite frontend + Hono backend + Solidity contracts.',
  files: [
    {
      path: 'package.json',
      content: `{
  "name": "{{name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "type": "module",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev":   "node scripts/dev.mjs",
    "build": "tsc -b packages/*/tsconfig.json"
  },
  "devDependencies": {
    "typescript": "^6.0.0"
  }
}
`,
    },
    {
      path: 'packages/frontend/package.json',
      content: `{
  "name": "@{{name}}/frontend",
  "version": "{{version}}",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": {
    "@cfxdevkit/core":           "*",
    "@cfxdevkit/react":          "*",
    "@cfxdevkit/theme":          "*",
    "@cfxdevkit/wallet-connect": "*",
    "@cfxdevkit/defi-react":     "*",
    "@tanstack/react-query":     "^5.0.0",
    "react":     "^19.0.0",
    "react-dom": "^19.0.0",
    "viem":      "^2.0.0",
    "wagmi":     "^2.0.0"
  },
  "devDependencies": {
    "@types/react":     "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^8.0.0"
  }
}
`,
    },
    {
      path: 'packages/frontend/src/main.tsx',
      content: `import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createEspaceClient } from '@cfxdevkit/core';
import { CfxProvider } from '@cfxdevkit/react';
import { espaceTestnet } from '@cfxdevkit/core/chains';
import { createCfxConfig } from '@cfxdevkit/wallet-connect';
import '@cfxdevkit/theme/css';
import { WagmiProvider } from 'wagmi';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

const client = createEspaceClient({ chain: espaceTestnet });
const queryClient = new QueryClient();
const wagmiConfig = createCfxConfig({ appName: '{{name}}' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <CfxProvider client={client}>
          <App />
        </CfxProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
`,
    },
    {
      path: 'packages/frontend/src/App.tsx',
      content: `import { useAccount } from 'wagmi';
import { Button, Card, NetworkBadge } from '@cfxdevkit/defi-react/primitives';
import { useChain } from '@cfxdevkit/react/context';

export function App() {
  const { address, isConnected } = useAccount();
  const chain = useChain();

  return (
    <main style={{ fontFamily: 'var(--cfx-font-sans)', padding: 32, maxWidth: 720, margin: '0 auto' }}>
      <h1>{{name}}</h1>
      <Card>
        <NetworkBadge chainId={chain.id} />
        {isConnected ? (
          <p>Connected: <code>{address}</code></p>
        ) : (
          <Button variant="primary">Connect Wallet</Button>
        )}
      </Card>
    </main>
  );
}
`,
    },
    {
      path: 'packages/frontend/index.html',
      content: `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>{{name}}</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: 'packages/backend/package.json',
      content: `{
  "name": "@{{name}}/backend",
  "version": "{{version}}",
  "type": "module",
  "scripts": { "dev": "node --watch dist/server.js", "build": "tsc" },
  "dependencies": {
    "@cfxdevkit/core":    "*",
    "@cfxdevkit/wallet":  "*",
    "hono": "^4.0.0"
  },
  "devDependencies": { "typescript": "^6.0.0", "@types/node": "^24.0.0" }
}
`,
    },
    {
      path: 'packages/backend/src/server.ts',
      content: `import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', service: '{{name}}-backend' }));

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(\`Backend running on http://localhost:\${info.port}\`);
});
`,
    },
    {
      path: 'packages/contracts/package.json',
      content: `{
  "name": "@{{name}}/contracts",
  "version": "{{version}}",
  "type": "module",
  "scripts": { "compile": "cfxdevkit-compiler compile src/Counter.sol" },
  "dependencies": { "@cfxdevkit/compiler": "*" }
}
`,
    },
    {
      path: 'packages/contracts/src/Counter.sol',
      content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public count;
    function increment() external { count++; }
    function decrement() external { require(count > 0, "underflow"); count--; }
    function reset() external { count = 0; }
}
`,
    },
    {
      path: 'README.md',
      content: `# {{name}}\n\n{{description}}\n\n## Dev\n\n\`\`\`sh\npnpm install\npnpm dev\n\`\`\`\n`,
    },
    { path: '.gitignore', content: `node_modules/\ndist/\n.env\ncoverage/\n` },
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
  "postCreateCommand": "npm install"
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
