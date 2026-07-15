/**
 * `@cfxdevkit/cdk/chains` — static catalog of Conflux chain configurations.
 *
 * Pure data + lookup. **No I/O.** Consumers call {@link getChain} or pick a
 * named const, then hand the result to `client/createClient`.
 */
import { CfxError } from '../errors/index.js';
import type { ChainId } from '../types/index.js';

/** Chain family discriminator. */
export type ChainFamily = 'core' | 'espace';

/** Network tier. */
export type Network = 'mainnet' | 'testnet' | 'devnet' | 'local';

/**
 * Network IDs for both chain families at a given tier.
 *
 * Used internally by wallet derivation to resolve the correct
 * networkId for cive (Core Space) when deriving accounts.
 */
export interface NetworkIds {
  /** eSpace network/chain ID. */
  espace: ChainId;
  /** Core Space network ID (used by cive for address encoding). */
  core: ChainId;
}

/** A single chain's static configuration. */
export interface ChainConfig {
  /** EIP-155 chain id. */
  readonly id: ChainId;
  /** Stable kebab-case slug, unique across the catalog. */
  readonly name: string;
  /** Human-readable display name. */
  readonly displayName: string;
  readonly network: Network;
  readonly family: ChainFamily;
  readonly nativeToken: { readonly symbol: string; readonly decimals: number };
  /** Public RPC endpoints. The first entry is the default. */
  readonly rpc: { readonly http: readonly string[]; readonly ws?: readonly string[] };
  readonly explorer?: { readonly name: string; readonly url: string };
}

// ── Conflux eSpace (EVM-compatible) ──────────────────────────────────────────

export const espaceMainnet: ChainConfig = {
  id: 1030,
  name: 'espace-mainnet',
  displayName: 'Conflux eSpace',
  network: 'mainnet',
  family: 'espace',
  nativeToken: { symbol: 'CFX', decimals: 18 },
  rpc: {
    http: ['https://evm.confluxrpc.com'],
    ws: ['wss://evm.confluxrpc.com/ws'],
  },
  explorer: { name: 'ConfluxScan', url: 'https://evm.confluxscan.io' },
};

export const espaceTestnet: ChainConfig = {
  id: 71,
  name: 'espace-testnet',
  displayName: 'Conflux eSpace Testnet',
  network: 'testnet',
  family: 'espace',
  nativeToken: { symbol: 'CFX', decimals: 18 },
  rpc: {
    http: ['https://evmtestnet.confluxrpc.com'],
    ws: ['wss://evmtestnet.confluxrpc.com/ws'],
  },
  explorer: { name: 'ConfluxScan Testnet', url: 'https://evmtestnet.confluxscan.io' },
};

export const espaceLocal: ChainConfig = {
  id: 2030,
  name: 'espace-local',
  displayName: 'Conflux eSpace (local)',
  network: 'local',
  family: 'espace',
  nativeToken: { symbol: 'CFX', decimals: 18 },
  rpc: { http: ['http://127.0.0.1:8545'] },
};

// ── Conflux Core Space (Conflux-native) ──────────────────────────────────────

export const coreSpaceMainnet: ChainConfig = {
  id: 1029,
  name: 'core-mainnet',
  displayName: 'Conflux Core Space',
  network: 'mainnet',
  family: 'core',
  nativeToken: { symbol: 'CFX', decimals: 18 },
  rpc: {
    http: ['https://main.confluxrpc.com'],
    ws: ['wss://main.confluxrpc.com/ws'],
  },
  explorer: { name: 'ConfluxScan', url: 'https://confluxscan.io' },
};

export const coreSpaceTestnet: ChainConfig = {
  id: 1,
  name: 'core-testnet',
  displayName: 'Conflux Core Space Testnet',
  network: 'testnet',
  family: 'core',
  nativeToken: { symbol: 'CFX', decimals: 18 },
  rpc: {
    http: ['https://test.confluxrpc.com'],
    ws: ['wss://test.confluxrpc.com/ws'],
  },
  explorer: { name: 'ConfluxScan Testnet', url: 'https://testnet.confluxscan.io' },
};

export const coreSpaceLocal: ChainConfig = {
  id: 2029,
  name: 'core-local',
  displayName: 'Conflux Core Space (local)',
  network: 'local',
  family: 'core',
  nativeToken: { symbol: 'CFX', decimals: 18 },
  rpc: { http: ['http://127.0.0.1:12537'] },
};

// ── Registry ─────────────────────────────────────────────────────────────────

const ALL_CHAINS: readonly ChainConfig[] = Object.freeze([
  espaceMainnet,
  espaceTestnet,
  espaceLocal,
  coreSpaceMainnet,
  coreSpaceTestnet,
  coreSpaceLocal,
]);

const CHAINS_BY_ID = new Map<ChainId, ChainConfig>(ALL_CHAINS.map((c) => [c.id, c]));
const CHAINS_BY_NAME = new Map<string, ChainConfig>(ALL_CHAINS.map((c) => [c.name, c]));

/** Look up a chain by numeric id or kebab-case slug. Throws {@link CfxError} if unknown. */
export function getChain(idOrName: ChainId | string): ChainConfig {
  const found =
    typeof idOrName === 'number' ? CHAINS_BY_ID.get(idOrName) : CHAINS_BY_NAME.get(idOrName);
  if (!found) {
    throw new CfxError({
      code: 'core/chains/unknown',
      message: `Unknown chain: ${String(idOrName)}`,
      meta: { idOrName },
    });
  }
  return found;
}

/** List chains, optionally filtered by family and/or network tier. */
export function listChains(filter?: {
  family?: ChainFamily;
  network?: Network;
}): readonly ChainConfig[] {
  if (!filter) return ALL_CHAINS;
  return ALL_CHAINS.filter(
    (c) =>
      (filter.family === undefined || c.family === filter.family) &&
      (filter.network === undefined || c.network === filter.network),
  );
}

/**
 * Identity validator for user-supplied chain configs. Currently performs
 * structural acceptance; future versions may enforce stricter invariants.
 */
export function defineChain(input: ChainConfig): ChainConfig {
  if (!Number.isInteger(input.id) || input.id <= 0) {
    throw new CfxError({
      code: 'core/chains/invalid',
      message: 'ChainConfig.id must be a positive integer',
      meta: { id: input.id },
    });
  }
  if (!input.name || !input.rpc.http.length) {
    throw new CfxError({
      code: 'core/chains/invalid',
      message: 'ChainConfig requires name and at least one HTTP RPC endpoint',
      meta: { name: input.name, rpc: input.rpc },
    });
  }
  return input;
}

// ── Network ID resolution ────────────────────────────────────────────────────

/**
 * Resolve network IDs for both chain families at a given tier.
 *
 * Returns `{ espace: <id>, core: <id> }` for the specified network.
 *
 * @param network - Network tier. Omitted to return all chains.
 * @example
 *   resolveNetworkIds('testnet')  → { espace: 71, core: 1 }
 *   resolveNetworkIds('mainnet') → { espace: 1030, core: 1029 }
 */
export function resolveNetworkIds(network?: Network): NetworkIds {
  if (!network) {
    throw new CfxError({
      code: 'core/chains/unknown',
      message: 'Network tier is required. Pass "mainnet", "testnet", or "local".',
      meta: { network },
    });
  }
  const espace = listChains({ family: 'espace', network }).at(0);
  const core = listChains({ family: 'core', network }).at(0);
  if (!espace) {
    throw new CfxError({
      code: 'core/chains/unknown',
      message: `No eSpace chain found for network "${network}"`,
      meta: { network },
    });
  }
  if (!core) {
    throw new CfxError({
      code: 'core/chains/unknown',
      message: `No Core Space chain found for network "${network}"`,
      meta: { network },
    });
  }
  return {
    espace: espace.id,
    core: core.id,
  };
}

/** Resolve a single network's chain config by name or ID. */
export function resolveNetwork(network: string | ChainId): {
  espace: ChainConfig;
  core: ChainConfig;
  network: Network;
} {
  const config = typeof network === 'number' ? getChain(network) : getChain(network);
  const espace = listChains({ family: 'espace', network: config.network }).at(0)!;
  const core = listChains({ family: 'core', network: config.network }).at(0)!;
  if (!espace || !core) {
    throw new CfxError({
      code: 'core/chains/unknown',
      message: `Could not resolve both eSpace and Core Space for network "${config.network}"`,
      meta: { network: config.network },
    });
  }
  return { espace, core, network: config.network };
}
