/**
 * Curated contract template registry. Each template ships its full Solidity
 * source inline so callers don't need to pull external repos or fight
 * resolver setup; the trade-off is that templates here are intentionally
 * minimal — for production use, callers can compile their own sources.
 */
import type { Source } from '../types.js';
import { EXAMPLE_COUNTER_PATH, EXAMPLE_COUNTER_SOURCE } from './counter/source.js';
import { BASIC_ERC20_PATH, BASIC_ERC20_SOURCE } from './erc20/source.js';
import { SIMPLE_STORAGE_PATH, SIMPLE_STORAGE_SOURCE } from './storage/source.js';
import { PAYABLE_VAULT_PATH, PAYABLE_VAULT_SOURCE } from './vault/source.js';

export interface TemplateMeta {
  /** Stable identifier for the template, e.g. `"basic-erc20"`. */
  id: string;
  /** Human-readable label. */
  name: string;
  /** Short description. */
  description: string;
  /** Contract name solc will emit (matches `contract X { ... }`). */
  contractName: string;
  /** Required solc version (clean semver). */
  solcVersion: string;
  /** EVM target used for broad local-node compatibility. */
  evmVersion?: string;
  /** Constructor parameter names + Solidity types, in order. */
  constructorArgs: readonly { name: string; type: string; defaultValue?: string }[];
  /** All sources required to compile this template. */
  sources: readonly Source[];
}

const BASIC_ERC20: TemplateMeta = {
  id: 'basic-erc20',
  name: 'Basic ERC-20',
  description:
    'Self-contained ERC-20 with no external imports. Mints initial supply to the deployer.',
  contractName: 'BasicErc20',
  solcVersion: '0.8.26',
  evmVersion: 'paris',
  constructorArgs: [
    { name: 'name_', type: 'string', defaultValue: 'MyToken' },
    { name: 'symbol_', type: 'string', defaultValue: 'MTK' },
    { name: 'decimals_', type: 'uint8', defaultValue: '18' },
    { name: 'initialSupply', type: 'uint256', defaultValue: '1000000' },
  ],
  sources: [{ path: BASIC_ERC20_PATH, content: BASIC_ERC20_SOURCE }],
};

const EXAMPLE_COUNTER: TemplateMeta = {
  id: 'example-counter',
  name: 'Example Counter',
  description:
    'Minimal stateful counter with increment, decrement, and reset. Good for testing read/write calls.',
  contractName: 'ExampleCounter',
  solcVersion: '0.8.26',
  evmVersion: 'paris',
  constructorArgs: [],
  sources: [{ path: EXAMPLE_COUNTER_PATH, content: EXAMPLE_COUNTER_SOURCE }],
};

const SIMPLE_STORAGE: TemplateMeta = {
  id: 'simple-storage',
  name: 'Simple Storage',
  description: 'Stores and retrieves a single uint256 value. Classic Solidity intro contract.',
  contractName: 'SimpleStorage',
  solcVersion: '0.8.26',
  evmVersion: 'paris',
  constructorArgs: [],
  sources: [{ path: SIMPLE_STORAGE_PATH, content: SIMPLE_STORAGE_SOURCE }],
};

const PAYABLE_VAULT: TemplateMeta = {
  id: 'payable-vault',
  name: 'Payable Vault',
  description:
    'Accepts CFX deposits (payable) and lets each depositor withdraw their own balance. Tests payable calls and receive().',
  contractName: 'PayableVault',
  solcVersion: '0.8.26',
  evmVersion: 'paris',
  constructorArgs: [],
  sources: [{ path: PAYABLE_VAULT_PATH, content: PAYABLE_VAULT_SOURCE }],
};

const REGISTRY = new Map<string, TemplateMeta>([
  [BASIC_ERC20.id, BASIC_ERC20],
  [EXAMPLE_COUNTER.id, EXAMPLE_COUNTER],
  [SIMPLE_STORAGE.id, SIMPLE_STORAGE],
  [PAYABLE_VAULT.id, PAYABLE_VAULT],
]);

/** Look up a template by id. Throws if unknown. */
export function getTemplate(id: string): TemplateMeta {
  const t = REGISTRY.get(id);
  if (!t) {
    throw new Error(`unknown template id: "${id}" (known: ${[...REGISTRY.keys()].join(', ')})`);
  }
  return t;
}

/** List every registered template. */
export function listTemplates(): readonly TemplateMeta[] {
  return [...REGISTRY.values()];
}

export {
  BASIC_ERC20 as basicErc20,
  EXAMPLE_COUNTER as exampleCounter,
  PAYABLE_VAULT as payableVault,
  SIMPLE_STORAGE as simpleStorage,
};
