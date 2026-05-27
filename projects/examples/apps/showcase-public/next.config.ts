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

// @noble/hashes: the OneKey SDK (hd-core) was compiled against v2.2.0 internals
// but imports using v1-style subpath names (blake2b, sha256, utils without .js extension)
// that are NOT in v2's exports map. Point them to the v2.2.0 actual files.
const NOBLE_HASHES_V2 =
  '/workspaces/root/node_modules/.pnpm/@noble+hashes@2.2.0/node_modules/@noble/hashes';
function nobleHashesAliases(): Record<string, string> {
  return {
    '@noble/hashes/utils': `${NOBLE_HASHES_V2}/utils.js`,
    '@noble/hashes/blake2b': `${NOBLE_HASHES_V2}/blake2.js`,
    '@noble/hashes/blake2s': `${NOBLE_HASHES_V2}/blake2.js`,
    '@noble/hashes/sha256': `${NOBLE_HASHES_V2}/sha2.js`,
    '@noble/hashes/sha512': `${NOBLE_HASHES_V2}/sha2.js`,
    '@noble/hashes/sha3': `${NOBLE_HASHES_V2}/sha3.js`,
  };
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: turbopackSingletons,
  },
  webpack(config, { isServer }) {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...webpackSingletons,
      ...nobleHashesAliases(),
    };

    // Stub Node.js built-ins that hd-common-connect-sdk references in the browser
    // bundle (they are never actually called — only USB paths are used via WebUSB).
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        usb: false,
        'node-hid': false,
        'node-usb': false,
        accounts: false,
      };
    }

    return config;
  },
};

// biome-ignore lint/style/noDefaultExport: Next.js requires default export
export default nextConfig;
