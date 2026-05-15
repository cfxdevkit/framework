import { createRequire } from 'node:module';
import path from 'node:path';
import type { NextConfig } from 'next';

const req = createRequire(import.meta.url);

const webpackSingletons: Record<string, string> = {
  wagmi: path.dirname(req.resolve('wagmi/package.json')),
  viem: path.dirname(req.resolve('viem/package.json')),
  '@tanstack/react-query': path.dirname(req.resolve('@tanstack/react-query/package.json')),
};

const turbopackSingletons: Record<string, string> = {
  wagmi: './node_modules/wagmi',
  viem: './node_modules/viem',
  '@tanstack/react-query': './node_modules/@tanstack/react-query',
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: turbopackSingletons,
  },
  webpack(config) {
    config.resolve.alias = { ...config.resolve.alias, ...webpackSingletons };
    return config;
  },
};

// biome-ignore lint/style/noDefaultExport: Next.js requires default export
export default nextConfig;
