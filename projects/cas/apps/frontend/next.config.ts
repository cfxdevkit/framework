import { createRequire } from 'node:module';
import path from 'node:path';
import type { NextConfig } from 'next';

const req = createRequire(import.meta.url);
const uiPackageRoot = path.dirname(req.resolve('@cfxdevkit/ui/package.json'));
const uiCorePackageRoot = path.dirname(req.resolve('@cfxdevkit/ui-core/package.json'));

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
//
// CAS keeps tsconfig source aliases for local typecheck, but Next must resolve
// shared UI packages through their built workspace entrypoints. Otherwise it
// will try to bundle ui/src/index.ts directly and fail on the internal `.js`
// specifiers that are correct in the emitted ESM package.
const webpackSingletons: Record<string, string> = {
  wagmi: path.dirname(req.resolve('wagmi/package.json')),
  viem: path.dirname(req.resolve('viem/package.json')),
  '@tanstack/react-query': path.dirname(req.resolve('@tanstack/react-query/package.json')),
  '@cfxdevkit/ui': path.join(uiPackageRoot, 'dist/index.js'),
  '@cfxdevkit/ui-core': path.join(uiCorePackageRoot, 'dist/index.js'),
};

const turbopackSingletons: Record<string, string> = {
  wagmi: './node_modules/wagmi',
  viem: './node_modules/viem',
  '@tanstack/react-query': './node_modules/@tanstack/react-query',
  '@cfxdevkit/ui': './node_modules/@cfxdevkit/ui/dist/index.js',
  '@cfxdevkit/ui-core': './node_modules/@cfxdevkit/ui-core/dist/index.js',
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
