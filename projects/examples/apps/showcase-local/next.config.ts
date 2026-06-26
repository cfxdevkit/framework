import path from 'node:path';
import type { NextConfig } from 'next';

const webpackSingletons: Record<string, string> = {
  viem: path.join(process.cwd(), 'node_modules', 'viem'),
};

const turbopackSingletons: Record<string, string> = {
  viem: './node_modules/viem',
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    'local.dev.cfxdevkit.org',
    'local.dev.cfxdevkit.org:8443',
    'showcase.dev.cfxdevkit.org:8443',
    'localhost:8443',
  ],
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
