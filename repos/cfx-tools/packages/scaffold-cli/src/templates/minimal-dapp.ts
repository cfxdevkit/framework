import type { TemplateDefinition } from './types.js';

export const MINIMAL_DAPP: TemplateDefinition = {
  name: 'minimal-dapp',
  description: 'Vite + React + @cfxdevkit/react — minimal frontend dApp with no backend.',
  files: [
    {
      path: 'package.json',
      content: `{
  "name": "{{name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "type": "module",
  "scripts": {
    "dev":   "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@cfxdevkit/core":    "*",
    "@cfxdevkit/react":  "*",
    "@cfxdevkit/theme":  "*",
    "@tanstack/react-query": "^5.0.0",
    "react":     "^19.0.0",
    "react-dom": "^19.0.0",
    "viem":      "^2.0.0"
  },
  "devDependencies": {
    "@types/react":     "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^6.0.0",
    "vite":       "^8.0.0"
  }
}
`,
    },
    {
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
    },
    {
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
`,
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{name}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: 'src/main.tsx',
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
      path: 'src/App.tsx',
      content: `import { ConnectButton } from '@cfxdevkit/wallet-connect/ui';
import { useAccount } from 'wagmi';
import { useChain } from '@cfxdevkit/react/context';

export function App() {
  const chain = useChain();
  const { address, isConnected } = useAccount();

  return (
    <main style={{ fontFamily: 'var(--cfx-font-sans)', padding: 32 }}>
      <h1>{{name}}</h1>
      <ConnectButton />
      {isConnected && <p>Connected: <code>{address}</code></p>}
      <p>Chain: <strong>{chain.name}</strong></p>
    </main>
  );
}
`,
    },
    {
      path: 'README.md',
      content: `# {{name}}\n\n{{description}}\n\n## Dev\n\n\`\`\`sh\npnpm install\npnpm dev\n\`\`\`\n`,
    },
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
  "forwardPorts": [5173],
  "postCreateCommand": "npm install"
}
`,
      },
    ],
    docker: [
      {
        path: 'Dockerfile',
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
        path: '.dockerignore',
        content: `node_modules\ndist\n.git\n`,
      },
    ],
  },
};
