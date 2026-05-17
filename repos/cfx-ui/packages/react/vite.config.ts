import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';

const reactExternals = new Set(['react', 'react-dom', 'react/jsx-runtime']);

/**
 * Preserves "use client" directives in library output chunks.
 * Rollup strips these during bundling; this plugin re-adds them to any
 * chunk whose source modules contained the directive.
 */
function preserveDirectives(): Plugin {
  const clientModules = new Set<string>();
  return {
    name: 'preserve-use-client',
    transform(code, id) {
      if (
        code.trimStart().startsWith('"use client"') ||
        code.trimStart().startsWith("'use client'")
      ) {
        clientModules.add(id);
      }
      return null;
    },
    generateBundle(_opts, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        const hasClient = chunk.moduleIds?.some((id) => clientModules.has(id));
        if (hasClient && !chunk.code.startsWith('"use client"')) {
          chunk.code = '"use client";\n' + chunk.code;
        }
      }
    },
  };
}

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'account/index': 'src/account.ts',
        'balance/index': 'src/balance.ts',
        'context/index': 'src/context.tsx',
        'contract/index': 'src/contract.ts',
        'events/index': 'src/events.ts',
        'tx/index': 'src/tx.ts',
        'keystore/index': 'src/keystore/index.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: (id) => reactExternals.has(id) || (!id.startsWith('.') && !id.startsWith('/')),
    },
    sourcemap: true,
    minify: false,
    target: 'es2023',
  },
  plugins: [
    preserveDirectives(),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    }),
  ],
});
