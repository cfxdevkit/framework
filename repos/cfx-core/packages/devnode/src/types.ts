import type { DualAddressAccount } from '@cfxdevkit/core';

/** A genesis account exposed by the dev node. */
export interface DevNodeAccount extends DualAddressAccount {
  /** Initial balance funded by the node, expressed in CFX (decimal string). */
  initialBalanceCfx: string;
}

/** Configuration accepted by {@link createDevNode}. All fields optional. */
export interface DevNodeConfig {
  /** Conflux Core Space chain id. Default `2029` (matches `coreSpaceLocal`). */
  chainId?: number;
  /** eSpace chain id. Default `2030` (matches `espaceLocal`). */
  evmChainId?: number;
  /** Core Space JSON-RPC HTTP port. Default `12537`. */
  coreRpcPort?: number;
  /** eSpace JSON-RPC HTTP port. Default `8545`. */
  evmRpcPort?: number;
  /** Core Space WS port. Default `12536`. */
  coreWsPort?: number;
  /** eSpace WS port. Default `8546`. */
  evmWsPort?: number;
  /** Where the node stores its data. Default `~/.cfxdevkit/devnode/<random>`. */
  dataDir?: string;
  /** BIP-39 mnemonic used to derive genesis accounts. Random by default. */
  mnemonic?: string;
  /** Number of pre-funded genesis accounts. Default `10`. */
  accounts?: number;
  /** Initial balance per account, in CFX (decimal string). Default `'1000000'`. */
  balanceCfx?: string;
  /**
   * Auto-miner interval in ms. `0` disables the miner; mining can still be
   * driven manually via {@link DevNode.mine}. Default `2000`.
   */
  miningIntervalMs?: number;
  /** Forward `@xcfx/node` logs to stdout. Default `false`. */
  logging?: boolean;
}

/** Snapshot of the auto-miner. */
export interface MiningStatus {
  enabled: boolean;
  intervalMs: number;
  /** Number of `mine({ numTxs: 1 })` ticks executed since the miner started. */
  ticks: number;
  startedAt?: Date;
}

/** Lifecycle phase of the underlying `@xcfx/node` server. */
export type DevNodeStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
