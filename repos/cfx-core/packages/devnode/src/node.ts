/** Spawns and manages a local Conflux node via `@xcfx/node`. */
import { mkdir } from 'node:fs/promises';
import { DevNodeError } from './errors.js';
import {
  type CiveTestClient,
  createAccounts,
  type ResolvedDevNodeConfig,
  resolveConfig,
  type XcfxServer,
} from './internals.js';
import { createMiningClient, createXcfxServer } from './server.js';
import type { DevNodeAccount, DevNodeConfig, DevNodeStatus, MiningStatus } from './types.js';

/** Resolved RPC endpoints exposed by a running node. */
export interface DevNodeUrls {
  core: string;
  espace: string;
  coreWs: string;
  espaceWs: string;
}

/** A handle to a spawned `@xcfx/node` server. Construct via {@link createDevNode}. */
export class DevNode {
  /** Resolved configuration after defaults are applied. */
  readonly config: ResolvedDevNodeConfig;

  /** Pre-funded genesis accounts, ordered by derivation index. */
  readonly accounts: DevNodeAccount[];

  /** Dedicated mining / faucet account. */
  readonly faucet: DevNodeAccount;

  private status: DevNodeStatus = 'stopped';
  private server: XcfxServer | null = null;
  private testClient: CiveTestClient | null = null;
  private miningTimer: ReturnType<typeof setInterval> | null = null;
  private mining: MiningStatus = { enabled: false, intervalMs: 0, ticks: 0 };
  private packing = false;

  constructor(config: DevNodeConfig = {}) {
    this.config = resolveConfig(config);

    const { accounts, faucet } = createAccounts(this.config);
    this.accounts = accounts;
    this.faucet = faucet;
  }

  /** Endpoints the node will listen on once {@link start} returns. */
  get urls(): DevNodeUrls {
    const c = this.config;
    return {
      core: `http://127.0.0.1:${c.coreRpcPort}`,
      espace: `http://127.0.0.1:${c.evmRpcPort}`,
      coreWs: `ws://127.0.0.1:${c.coreWsPort}`,
      espaceWs: `ws://127.0.0.1:${c.evmWsPort}`,
    };
  }

  getStatus(): DevNodeStatus {
    return this.status;
  }

  isRunning(): boolean {
    return this.status === 'running';
  }

  getMiningStatus(): MiningStatus {
    return { ...this.mining };
  }

  /** Boot the underlying `@xcfx/node` server. */
  async start(): Promise<void> {
    if (this.status === 'running' || this.status === 'starting') {
      throw new DevNodeError({
        code: 'devnode/already-running',
        message: `dev node is already ${this.status}`,
      });
    }
    this.status = 'starting';
    try {
      await mkdir(this.config.dataDir, { recursive: true, mode: 0o755 });

      this.server = await createXcfxServer(this.config, this.accounts, this.faucet);
      await this.server.start();

      this.status = 'running';

      if (this.config.miningIntervalMs > 0) {
        await this.startMining(this.config.miningIntervalMs);
      }
    } catch (cause) {
      this.status = 'error';
      throw new DevNodeError({
        code: 'devnode/start-failed',
        message: cause instanceof Error ? cause.message : String(cause),
        cause,
      });
    }
  }

  /** Stop the auto-miner (if running) and shut the server down. */
  async stop(): Promise<void> {
    if (this.status === 'stopped') return;
    this.status = 'stopping';
    try {
      if (this.mining.enabled) {
        try {
          await this.stopMining();
        } catch {
          // Best-effort: if the miner is in a weird state we still want to stop the server.
        }
      }
      if (this.server) {
        await this.server.stop();
        this.server = null;
      }
      this.testClient = null;
      this.status = 'stopped';
    } catch (cause) {
      this.status = 'error';
      throw new DevNodeError({
        code: 'devnode/stop-failed',
        message: cause instanceof Error ? cause.message : String(cause),
        cause,
      });
    }
  }

  /** Convenience: `stop()` + `start()`. */
  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /** Mine `blocks` empty Core blocks without packing pending txs. */
  async mine(blocks = 1): Promise<void> {
    this.assertRunning();
    const client = await this.requireTestClient();
    await client.mine({ blocks });
  }

  /** Pack pending Core and eSpace transactions into the next block. */
  async packMine(): Promise<void> {
    this.assertRunning();
    const client = await this.requireTestClient();
    this.packing = true;
    try {
      await client.mine({ numTxs: 1 });
      this.mining.ticks += 1;
    } finally {
      this.packing = false;
    }
  }

  /** Begin auto-mining. */
  async startMining(intervalMs?: number): Promise<void> {
    this.assertRunning();
    if (this.mining.enabled) {
      if (intervalMs === undefined || intervalMs === this.mining.intervalMs) return;
      throw new DevNodeError({
        code: 'devnode/mining-already-running',
        message: `auto-miner already running at ${this.mining.intervalMs}ms`,
      });
    }
    const ms = intervalMs ?? this.config.miningIntervalMs;
    if (!Number.isFinite(ms) || ms < 100) {
      throw new DevNodeError({
        code: 'devnode/invalid-config',
        message: `miningIntervalMs must be >= 100, got ${ms}`,
      });
    }
    await this.requireTestClient();
    this.mining = { enabled: true, intervalMs: ms, ticks: 0, startedAt: new Date() };
    this.miningTimer = setInterval(() => {
      // Skip if a manual packMine() is in flight to avoid concurrent RPCs.
      if (this.packing || !this.testClient) return;
      this.testClient.mine({ numTxs: 1 }).then(
        () => {
          this.mining.ticks += 1;
        },
        () => {
          // Swallow errors so a transient RPC blip doesn't crash the timer.
        },
      );
    }, ms);
  }

  /** Stop the auto-miner. Safe to call when not running. */
  async stopMining(): Promise<void> {
    if (!this.mining.enabled) {
      throw new DevNodeError({
        code: 'devnode/mining-not-running',
        message: 'auto-miner is not running',
      });
    }
    if (this.miningTimer) clearInterval(this.miningTimer);
    this.miningTimer = null;
    this.mining = { ...this.mining, enabled: false };
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private assertRunning(): void {
    if (this.status !== 'running') {
      throw new DevNodeError({
        code: 'devnode/not-running',
        message: `dev node is not running (status=${this.status})`,
      });
    }
  }

  private async requireTestClient(): Promise<CiveTestClient> {
    if (this.testClient) return this.testClient;
    this.testClient = await createMiningClient(this.urls);
    return this.testClient;
  }
}

/** Construct a {@link DevNode} with default ports / accounts. */
export function createDevNode(config: DevNodeConfig = {}): DevNode {
  return new DevNode(config);
}
