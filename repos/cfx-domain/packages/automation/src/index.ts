// Public surface for @cfxdevkit/automation.
export const __packageName = '@cfxdevkit/automation' as const;

export * from './conditions/price.js';
export * from './conditions/time.js';
export * from './keeper.js';
export * from './keeper-client.js';
export * from './price-sources/gecko-terminal.js';
export * from './price-sources/swappi.js';
export * from './repository/memory.js';
export * from './repository.js';
export * from './safety.js';
export * from './strategies/dca.js';
export * from './strategies/limit-order.js';
export * from './strategies/types.js';
export * from './types.js';
