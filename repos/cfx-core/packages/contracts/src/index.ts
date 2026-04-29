/**
 * `@cfxdevkit/contracts` — barrel export.
 *
 * Prefer the sub-paths (`./abis`, `./read`, `./write`, `./deploy`, `./erc20`,
 * `./errors`) over this barrel; importing them keeps tree-shaking sharp.
 */
export * from './abis/index.js';
export * from './deploy/index.js';
export { type Erc20Bind, erc20 } from './erc20/index.js';
export * from './errors/index.js';
export * from './read/index.js';
export * from './write/index.js';
export const __packageName = '@cfxdevkit/contracts' as const;
