/**
 * Curated contract template registry. Each template ships its full Solidity
 * source inline so callers don't need to pull external repos or fight
 * resolver setup; the trade-off is that templates here are intentionally
 * minimal — for production use, callers can compile their own sources.
 */
import type { Source } from '../types.js';
import { BASIC_ERC20_PATH, BASIC_ERC20_SOURCE } from './erc20/source.js';

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
  /** Constructor parameter names + Solidity types, in order. */
  constructorArgs: readonly { name: string; type: string }[];
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
  constructorArgs: [
    { name: 'name_', type: 'string' },
    { name: 'symbol_', type: 'string' },
    { name: 'decimals_', type: 'uint8' },
    { name: 'initialSupply', type: 'uint256' },
  ],
  sources: [{ path: BASIC_ERC20_PATH, content: BASIC_ERC20_SOURCE }],
};

const REGISTRY = new Map<string, TemplateMeta>([[BASIC_ERC20.id, BASIC_ERC20]]);

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

export { BASIC_ERC20 as basicErc20 };
