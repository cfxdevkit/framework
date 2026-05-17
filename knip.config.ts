import type { KnipConfig } from 'knip';

/**
 * Knip — unused dependency and dead code detection.
 * Docs: https://knip.dev
 *
 * Run:  pnpm check:unused
 * Fix:  pnpm check:unused --fix   (removes unused exports/types from index files)
 */
const config: KnipConfig = {
  /**
   * Global dependencies that knip can't detect because they're used by:
   * - biome.json "extends" (not TS imports)
   * - tsconfig.json "extends" (not TS imports)
   * - PostCSS / Tailwind pipeline
   * - Vite polyfills
   * - Drizzle CLI migrations
   * - Dynamic / CLI invocation
   */
  ignoreDependencies: [
    '@cfxdevkit/biome-config',
    '@cfxdevkit/tsconfig',
    'tailwindcss',
    'buffer',
    'drizzle-kit',
    'mermaid',
    'tsx',
    'vitest',
    'jsdom',
    'server-only', // Next.js built-in, not a real package dep
  ],

  ignoreExportsUsedInFile: true,

  workspaces: {
    '.': {
      entry: ['scripts/*.mjs', 'scripts/*.ts'],
      project: ['scripts/**/*.{ts,mjs}'],
      ignoreDependencies: [
        '@moonrepo/cli',
        '@changesets/cli',
        'gitnexus',
        '@biomejs/biome',
        'typescript',
        'vite',
        'knip',
      ],
    },

    'repos/cfx-core/packages/*': {
      entry: ['src/index.ts!', 'src/bin/**/*.ts!'],
      project: ['src/**/*.ts'],
    },
    'repos/cfx-keys/packages/*': {
      entry: ['src/index.ts!', 'src/bin/**/*.ts!'],
      project: ['src/**/*.ts'],
      ignoreDependencies: [
        // Loaded via dynamic import string splitting to avoid static bundling.
        // e.g.: const m = await import(['@ledgerhq','hw-transport-node-hid'].join('/'))
        '@ledgerhq/hw-app-eth',
        '@ledgerhq/hw-transport-node-hid',
      ],
    },
    'repos/cfx-ui/packages/*': {
      entry: ['src/index.ts!', 'src/index.tsx!', 'src/bin/**/*.ts!'],
      project: ['src/**/*.{ts,tsx}'],
    },
    'repos/cfx-solidity/packages/*': {
      entry: ['src/index.ts!'],
      project: ['src/**/*.ts'],
    },

    'repos/cfx-tools/packages/*': {
      entry: ['src/index.ts!', 'src/bin/**/*.ts!', 'workers/**/*.ts!'],
      project: ['src/**/*.ts', 'workers/**/*.ts'],
    },
    'repos/cfx-llm/packages/*': {
      entry: ['src/index.ts!', 'src/bin/**/*.ts!', 'workers/**/*.ts!'],
      project: ['src/**/*.ts', 'workers/**/*.ts'],
      ignoreDependencies: ['@cfxdevkit/arch-check', '@cfxdevkit/llm-client'],
    },

    'repos/cfx-meta/packages/*': {
      entry: ['src/index.ts!'],
      project: ['src/**/*.ts'],
    },
    'repos/cfx-config/packages/*': {
      entry: ['*.json', '*.ts'],
      project: ['**/*.{ts,json}'],
    },

    'repos/cfx-domain/packages/*': {
      entry: ['src/index.ts!'],
      project: ['src/**/*.ts'],
    },

    'projects/examples/apps/*': {
      entry: ['src/main.ts!', 'src/main.tsx!', 'app/page.tsx!', 'src/index.ts!'],
      project: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
    },
    'projects/examples/packages/*': {
      entry: ['src/index.ts!', 'src/index.tsx!'],
      project: ['src/**/*.{ts,tsx}'],
    },
    'projects/cas/apps/frontend': {
      entry: ['src/main.tsx!'],
      project: ['src/**/*.{ts,tsx}'],
      ignore: ['src/components/JobForm.tsx', 'src/components/SystemAdminPanel.tsx'],
    },
    'projects/cas/apps/*': {
      entry: ['src/main.ts!', 'src/main.tsx!', 'src/index.ts!'],
      project: ['src/**/*.{ts,tsx}'],
    },
    'projects/cas/packages/*': {
      entry: ['src/index.ts!', 'src/index.tsx!'],
      project: ['src/**/*.{ts,tsx}'],
    },
  },

  ignore: [
    '**/.moon/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.cfxdevkit/**',
    '**/artifacts/**',
    '**/*.config.ts',
    '**/*.config.js',
    '**/vitest.config.ts',
    '**/vite.config.ts',
  ],
};

export default config;
