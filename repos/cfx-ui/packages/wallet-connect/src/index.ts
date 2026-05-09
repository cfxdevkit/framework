// Public surface for @cfxdevkit/wallet-connect.
// Implementations land here as the package is filled in. See ./API.md.
export const __packageName = '@cfxdevkit/wallet-connect' as const;
export * from './config/index.js';
export * from './hooks/index.js';
export * from './lib/coreWalletPrimitives.js';
export * from './lib/err.js';
export * from './lib/switchConfluxChain.js';
export * from './lib/walletState.js';
export * from './siwe/index.js';
export * from './ui/index.js';
