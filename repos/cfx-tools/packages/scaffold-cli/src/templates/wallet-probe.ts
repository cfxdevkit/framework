import type { TemplateDefinition } from './types.js';

export const WALLET_PROBE: TemplateDefinition = {
  name: 'wallet-probe',
  description: 'Wallet detection + signing demo — connect Fluent or any injected wallet.',
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
    "@cfxdevkit/core":           "*",
    "@cfxdevkit/react":          "*",
    "@cfxdevkit/theme":          "*",
    "@cfxdevkit/wallet-connect": "*",
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

export default defineConfig({ plugins: [react()] });
`,
    },
    {
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2022",
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
  <head><meta charset="UTF-8" /><title>{{name}}</title></head>
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
      content: `import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <main style={{ fontFamily: 'var(--cfx-font-sans)', padding: 32 }}>
      <h1>{{name}}</h1>
      {isConnected ? (
        <>
          <p>Connected: <code>{address}</code></p>
          <button type="button" onClick={() => disconnect()}>Disconnect</button>
        </>
      ) : (
        connectors.map((c) => (
          <button key={c.id} type="button" onClick={() => connect({ connector: c })}>
            Connect {c.name}
          </button>
        ))
      )}
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
};
