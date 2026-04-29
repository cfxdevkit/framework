/**
 * In-process singleton manager for `@cfxdevkit/devnode`. The showcase backend
 * spawns at most one local Conflux node and exposes lifecycle endpoints
 * (start/stop/restart/wipe/mine/status) over HTTP.
 *
 * **Dev only.** Returns genesis private keys verbatim so the showcase can
 * fund a browser wallet without manual copy/paste.
 */
import { rm } from 'node:fs/promises';
import { createDevNode, type DevNode, type DevNodeConfig } from '@cfxdevkit/devnode';

export interface DevNodeAccountSnapshot {
  index: number;
  evmAddress: string;
  coreAddress: string;
  privateKey: string;
  initialBalanceCfx: string;
}

export interface DevNodeStatusSnapshot {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  running: boolean;
  urls?: { core: string; espace: string; coreWs: string; espaceWs: string };
  config?: {
    chainId: number;
    evmChainId: number;
    coreRpcPort: number;
    evmRpcPort: number;
    accounts: number;
    balanceCfx: string;
    miningIntervalMs: number;
    dataDir: string;
    mnemonic: string;
  };
  mining?: { enabled: boolean; intervalMs: number; ticks: number; startedAt?: string };
  accounts?: DevNodeAccountSnapshot[];
  faucet?: DevNodeAccountSnapshot;
}

/**
 * Subset of {@link DevNodeConfig} accepted over the wire. Ports are fixed to
 * the canonical local values (no point exposing them through HTTP \u2014 the
 * showcase frontend only knows how to talk to the defaults), but
 * mnemonic/accounts/mining can be overridden.
 */
export interface DevNodeStartRequest {
  mnemonic?: string;
  accounts?: number;
  miningIntervalMs?: number;
  logging?: boolean;
}

export class DevNodeBusyError extends Error {
  status = 409 as const;
  constructor(message: string) {
    super(message);
    this.name = 'DevNodeBusyError';
  }
}

export class DevNodeNotRunningError extends Error {
  status = 409 as const;
  constructor(message = 'dev node is not running') {
    super(message);
    this.name = 'DevNodeNotRunningError';
  }
}

/**
 * Singleton lifecycle manager. Serializes every mutating call through
 * {@link inFlight} so two concurrent HTTP requests can't race the underlying
 * `@xcfx/node` process.
 */
export class DevNodeManager {
  private node: DevNode | null = null;
  private inFlight: Promise<unknown> | null = null;

  private async serialize<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (this.inFlight) {
      throw new DevNodeBusyError(`another ${label}-class operation is in progress`);
    }
    const p = fn();
    this.inFlight = p.catch(() => undefined);
    try {
      return await p;
    } finally {
      this.inFlight = null;
    }
  }

  status(): DevNodeStatusSnapshot {
    const node = this.node;
    if (!node) return { status: 'stopped', running: false };
    const mining = node.getMiningStatus();
    return {
      status: node.getStatus(),
      running: node.isRunning(),
      urls: node.urls,
      config: {
        chainId: node.config.chainId,
        evmChainId: node.config.evmChainId,
        coreRpcPort: node.config.coreRpcPort,
        evmRpcPort: node.config.evmRpcPort,
        accounts: node.config.accounts,
        balanceCfx: node.config.balanceCfx,
        miningIntervalMs: node.config.miningIntervalMs,
        dataDir: node.config.dataDir,
        mnemonic: node.config.mnemonic,
      },
      mining: {
        enabled: mining.enabled,
        intervalMs: mining.intervalMs,
        ticks: mining.ticks,
        ...(mining.startedAt ? { startedAt: mining.startedAt.toISOString() } : {}),
      },
      accounts: node.accounts.map(toAccountSnapshot),
      faucet: toAccountSnapshot(node.faucet),
    };
  }

  async start(req: DevNodeStartRequest = {}): Promise<DevNodeStatusSnapshot> {
    return this.serialize('start', async () => {
      if (this.node && this.node.getStatus() !== 'stopped') {
        throw new DevNodeBusyError(`dev node is already ${this.node.getStatus()}`);
      }
      const cfg: DevNodeConfig = {};
      if (req.mnemonic !== undefined) cfg.mnemonic = req.mnemonic;
      if (req.accounts !== undefined) cfg.accounts = req.accounts;
      if (req.miningIntervalMs !== undefined) cfg.miningIntervalMs = req.miningIntervalMs;
      if (req.logging !== undefined) cfg.logging = req.logging;
      this.node = createDevNode(cfg);
      await this.node.start();
      return this.status();
    });
  }

  async stop(): Promise<DevNodeStatusSnapshot> {
    return this.serialize('stop', async () => {
      if (!this.node || this.node.getStatus() === 'stopped') {
        throw new DevNodeNotRunningError();
      }
      await this.node.stop();
      // Keep the snapshot around so the UI can still read accounts/mnemonic
      // until the next start; clear on wipe instead.
      return this.status();
    });
  }

  async restart(): Promise<DevNodeStatusSnapshot> {
    return this.serialize('restart', async () => {
      if (!this.node) throw new DevNodeNotRunningError();
      await this.node.restart();
      return this.status();
    });
  }

  /** Stop the node (if running) and delete its data directory. */
  async wipe(): Promise<DevNodeStatusSnapshot> {
    return this.serialize('wipe', async () => {
      const dataDir = this.node?.config.dataDir;
      if (this.node && this.node.getStatus() !== 'stopped') {
        await this.node.stop();
      }
      if (dataDir) {
        await rm(dataDir, { recursive: true, force: true });
      }
      this.node = null;
      return this.status();
    });
  }

  /**
   * `blocks > 0` advances empty blocks (no tx packing); `pack` runs a single
   * `mine({ numTxs: 1 })` which packs both Core + eSpace pending txs.
   */
  async mine(opts: { blocks?: number; pack?: boolean }): Promise<DevNodeStatusSnapshot> {
    return this.serialize('mine', async () => {
      if (!this.node?.isRunning()) throw new DevNodeNotRunningError();
      if (opts.pack) {
        await this.node.packMine();
      } else {
        await this.node.mine(opts.blocks ?? 1);
      }
      return this.status();
    });
  }

  /** Test hook: stop + clear without deleting the data directory. */
  async dispose(): Promise<void> {
    if (this.node && this.node.getStatus() !== 'stopped') {
      try {
        await this.node.stop();
      } catch {
        // ignore on shutdown
      }
    }
    this.node = null;
  }
}

function toAccountSnapshot(a: {
  index: number;
  evmAddress: string;
  coreAddress: string;
  privateKey: string;
  initialBalanceCfx: string;
}): DevNodeAccountSnapshot {
  return {
    index: a.index,
    evmAddress: a.evmAddress,
    coreAddress: a.coreAddress,
    privateKey: a.privateKey,
    initialBalanceCfx: a.initialBalanceCfx,
  };
}

/** Process-wide singleton used by the HTTP router. */
export const devNodeManager = new DevNodeManager();
