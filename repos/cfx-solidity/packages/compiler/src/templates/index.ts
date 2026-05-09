/**
 * Curated contract template registry. Each template ships its full Solidity
 * source inline so callers don't need to pull external repos or fight
 * resolver setup; the trade-off is that templates here are intentionally
 * minimal — for production use, callers can compile their own sources.
 */
import type { Source } from '../types.js';
import { BALLOT_PATH, BALLOT_SOURCE } from './ballot/source.js';
import { EXAMPLE_COUNTER_PATH, EXAMPLE_COUNTER_SOURCE } from './counter/source.js';
import { BASIC_ERC20_PATH, BASIC_ERC20_SOURCE } from './erc20/source.js';
import { BASIC_ERC721_PATH, BASIC_ERC721_SOURCE } from './erc721/source.js';
import { SIMPLE_ESCROW_PATH, SIMPLE_ESCROW_SOURCE } from './escrow/source.js';
import { MULTI_SIG_WALLET_PATH, MULTI_SIG_WALLET_SOURCE } from './multisig/source.js';
import { NAME_REGISTRY_PATH, NAME_REGISTRY_SOURCE } from './registry/source.js';
import { SIMPLE_STORAGE_PATH, SIMPLE_STORAGE_SOURCE } from './storage/source.js';
import { TEST_TOKEN_PATH, TEST_TOKEN_SOURCE } from './test-token/source.js';
import { PAYABLE_VAULT_PATH, PAYABLE_VAULT_SOURCE } from './vault/source.js';
import { VOTING_PATH, VOTING_SOURCE } from './voting/source.js';

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

const BASIC_ERC721: TemplateMeta = {
  id: 'basic-erc721',
  name: 'Basic ERC-721',
  description: 'Self-contained ERC-721 NFT with owner-only safe minting and no external imports.',
  contractName: 'BasicErc721',
  solcVersion: '0.8.26',
  evmVersion: 'paris',
  constructorArgs: [
    { name: 'name_', type: 'string', defaultValue: 'MyNFT' },
    { name: 'symbol_', type: 'string', defaultValue: 'MNFT' },
  ],
  sources: [{ path: BASIC_ERC721_PATH, content: BASIC_ERC721_SOURCE }],
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

const SIMPLE_ESCROW: TemplateMeta = {
  id: 'simple-escrow',
  name: 'Simple Escrow',
  description:
    'Three-party escrow (buyer, seller, arbiter). Buyer deposits at deploy time; arbiter calls release() or refund().',
  contractName: 'SimpleEscrow',
  solcVersion: '0.8.26',
  evmVersion: 'paris',
  constructorArgs: [
    { name: 'seller_', type: 'address' },
    { name: 'arbiter_', type: 'address' },
  ],
  sources: [{ path: SIMPLE_ESCROW_PATH, content: SIMPLE_ESCROW_SOURCE }],
};

const MULTI_SIG_WALLET: TemplateMeta = {
  id: 'multi-sig-wallet',
  name: 'Multi-Sig Wallet',
  description:
    'M-of-N multi-signature wallet. Owners submit, confirm, revoke, and execute transactions.',
  contractName: 'MultiSigWallet',
  solcVersion: '0.8.26',
  evmVersion: 'paris',
  constructorArgs: [
    { name: 'owners_', type: 'address[]' },
    { name: 'required_', type: 'uint256', defaultValue: '2' },
  ],
  sources: [{ path: MULTI_SIG_WALLET_PATH, content: MULTI_SIG_WALLET_SOURCE }],
};

const NAME_REGISTRY: TemplateMeta = {
  id: 'name-registry',
  name: 'Name Registry',
  description:
    'On-chain name → address mapping. First-come-first-served. Supports update, ownership transfer, and release.',
  contractName: 'NameRegistry',
  solcVersion: '0.8.26',
  evmVersion: 'paris',
  constructorArgs: [],
  sources: [{ path: NAME_REGISTRY_PATH, content: NAME_REGISTRY_SOURCE }],
};

const TEST_TOKEN: TemplateMeta = {
  id: 'test-token',
  name: 'Test Token',
  description:
    'ERC-20 with unrestricted public minting — for local dev and testing only. Do NOT deploy to mainnet.',
  contractName: 'TestToken',
  solcVersion: '0.8.26',
  evmVersion: 'paris',
  constructorArgs: [
    { name: 'name_', type: 'string', defaultValue: 'TestToken' },
    { name: 'symbol_', type: 'string', defaultValue: 'TEST' },
    { name: 'decimals_', type: 'uint8', defaultValue: '18' },
  ],
  sources: [{ path: TEST_TOKEN_PATH, content: TEST_TOKEN_SOURCE }],
};

const VOTING: TemplateMeta = {
  id: 'voting',
  name: 'Voting',
  description:
    'Simple one-vote-per-address proposal voting. Owner can close voting; winner is the highest-vote proposal.',
  contractName: 'Voting',
  solcVersion: '0.8.26',
  evmVersion: 'paris',
  constructorArgs: [{ name: 'proposalNames_', type: 'string[]' }],
  sources: [{ path: VOTING_PATH, content: VOTING_SOURCE }],
};

const BALLOT: TemplateMeta = {
  id: 'ballot',
  name: 'Ballot',
  description:
    'Weighted-vote ballot with delegation. Chairperson grants rights; voters can delegate or cast their vote.',
  contractName: 'Ballot',
  solcVersion: '0.8.26',
  evmVersion: 'paris',
  constructorArgs: [{ name: 'proposalNames', type: 'bytes32[]' }],
  sources: [{ path: BALLOT_PATH, content: BALLOT_SOURCE }],
};

const REGISTRY = new Map<string, TemplateMeta>([
  [BASIC_ERC20.id, BASIC_ERC20],
  [BASIC_ERC721.id, BASIC_ERC721],
  [EXAMPLE_COUNTER.id, EXAMPLE_COUNTER],
  [SIMPLE_STORAGE.id, SIMPLE_STORAGE],
  [PAYABLE_VAULT.id, PAYABLE_VAULT],
  [SIMPLE_ESCROW.id, SIMPLE_ESCROW],
  [MULTI_SIG_WALLET.id, MULTI_SIG_WALLET],
  [NAME_REGISTRY.id, NAME_REGISTRY],
  [TEST_TOKEN.id, TEST_TOKEN],
  [VOTING.id, VOTING],
  [BALLOT.id, BALLOT],
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
  BASIC_ERC721 as basicErc721,
  EXAMPLE_COUNTER as exampleCounter,
  PAYABLE_VAULT as payableVault,
  SIMPLE_STORAGE as simpleStorage,
};
