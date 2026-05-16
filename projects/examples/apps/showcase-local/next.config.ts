import { createRequire } from 'node:module';
import path from 'node:path';
import type { NextConfig } from 'next';

const req = createRequire(import.meta.url);

const webpackSingletons: Record<string, string> = {
  viem: path.dirname(req.resolve('viem/package.json')),
};

const turbopackSingletons: Record<string, string> = {
  viem: './node_modules/viem',
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@cfxdevkit/devnode-server', '@cfxdevkit/devnode', '@xcfx/node'],
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
