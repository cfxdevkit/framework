import { createRequire } from 'module';
import path from 'path';
import type { NextConfig } from 'next';

const req = createRequire(import.meta.url);

// Force all workspace packages (e.g. @cfxdevkit/wallet-connect) to use the
// same physical wagmi / viem / react-query instances as the app itself.
// Without this, pnpm creates separate peer-dep resolution contexts for each
// workspace package, resulting in two React context trees and the
// "WagmiProviderNotFoundError" at runtime.
//
// Turbopack (default in Next.js 16): resolveAlias only accepts relative paths.
// We use ./node_modules/<pkg> — the frontend's own symlinks — so the path stays
// within the project directory and Turbopack always resolves to the same instance.
//
// Webpack (next build / --webpack): absolute paths via createRequire.
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

export default nextConfig;
