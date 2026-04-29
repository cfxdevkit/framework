/**
 * Spawns and manages a local Conflux node via `@xcfx/node`. See
 * [`./index.ts`](./index.ts) for the package overview.
 *
 * Mining design (mirrors the upstream `@xcfx/node` test harness):
 *
 * - `devPackTxImmediately: false` so eSpace transactions never auto-pack on
 *   the Core path.
 * - `mine({ numTxs: 1 })` (a.k.a. `test_generateOneBlock`) is the only call
 *   that packs both Core *and* eSpace pending txs. The auto-miner ticks at
 *   {@link DevNodeConfig.miningIntervalMs} (default 2 s).
 * - `mine({ blocks })` advances by N empty blocks; useful for forcing the
 *   deferred-execution epoch advance in tests.
 */
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  coreAddressFromPrivateKey,
  deriveAccount,
  generateMnemonic,
  validateMnemonic,
} from '@cfxdevkit/core';
import { DevNodeError } from './errors.js';
import type { DevNodeAccount, DevNodeConfig, DevNodeStatus, MiningStatus } from './types.js';

const DEFAULTS = {
  chainId: 2029,
  evmChainId: 2030,
  coreRpcPort: 12537,
  evmRpcPort: 8545,
  coreWsPort: 12536,
  evmWsPort: 8546,
  accounts: 10,
  balanceCfx: '10000',
  miningIntervalMs: 2000,
  logging: false,
} as const;

/** Resolved RPC endpoints exposed by a running node. */
export interface DevNodeUrls {
  core: string;
  espace: string;
  coreWs: string;
  espaceWs: string;
}

interface XcfxServer {
  start(): Promise<void> | void;
  stop(): Promise<void> | void;
}
interface CiveTestClient {
  mine(args: { numTxs?: number; blocks?: number }): Promise<unknown>;
}

/**
 * A handle to a spawned `@xcfx/node` server. Construct via {@link createDevNode}.
 *
 * Typical use:
 *
 * ```ts
 * const node = createDevNode();
 * await node.start();
 * try {
 *   // node.urls.core / node.urls.espace point at the running RPCs
 *   // node.accounts[0] is pre-funded (configurable balance)
 * } finally {
 *   await node.stop();
 * }
 * ```
 */
export class DevNode {
  /** Resolved configuration after defaults are applied. */
  readonly config: Required<Omit<DevNodeConfig, 'mnemonic' | 'dataDir'>> & {
    mnemonic: string;
    dataDir: string;
  };

  /** Pre-funded genesis accounts, ordered by derivation index. */
  readonly accounts: DevNodeAccount[];

  /**
   * Dedicated mining / faucet account. Receives block rewards and is funded
   * at genesis like {@link accounts}. Derivation: `accountType: 'mining'`.
   */
  readonly faucet: DevNodeAccount;

  private status: DevNodeStatus = 'stopped';
  private server: XcfxServer | null = null;
  private testClient: CiveTestClient | null = null;
  private miningTimer: ReturnType<typeof setInterval> | null = null;
  private mining: MiningStatus = { enabled: false, intervalMs: 0, ticks: 0 };
  private packing = false;

  constructor(config: DevNodeConfig = {}) {
    const mnemonic = config.mnemonic ?? generateMnemonic(128);
    if (!validateMnemonic(mnemonic)) {
      throw new DevNodeError({
        code: 'devnode/invalid-config',
        message: 'mnemonic failed BIP-39 validation',
      });
    }
    const dataDir =
      config.dataDir ??
      join(homedir() || tmpdir(), '.cfxdevkit', 'devnode', randomBytes(4).toString('hex'));

    this.config = {
      chainId: config.chainId ?? DEFAULTS.chainId,
      evmChainId: config.evmChainId ?? DEFAULTS.evmChainId,
      coreRpcPort: config.coreRpcPort ?? DEFAULTS.coreRpcPort,
      evmRpcPort: config.evmRpcPort ?? DEFAULTS.evmRpcPort,
      coreWsPort: config.coreWsPort ?? DEFAULTS.coreWsPort,
      evmWsPort: config.evmWsPort ?? DEFAULTS.evmWsPort,
      accounts: config.accounts ?? DEFAULTS.accounts,
      balanceCfx: config.balanceCfx ?? DEFAULTS.balanceCfx,
      miningIntervalMs: config.miningIntervalMs ?? DEFAULTS.miningIntervalMs,
      logging: config.logging ?? DEFAULTS.logging,
      mnemonic,
      dataDir,
    };

    // xcfx funds the SAME secp256k1 key on both spaces (one entry in
    // genesisSecrets + genesisEvmSecrets), so a dev account must use a single
    // key for both addresses or the displayed Core address won't be the one
    // that received the genesis allocation. We therefore derive each account
    // from a single EVM-style BIP-44 path and re-encode that key as Core
    // base32 — `coreAddressFromPrivateKey` is purely an encoding step.
    this.accounts = [];
    for (let i = 0; i < this.config.accounts; i++) {
      this.accounts.push(this.makeAccount(`m/44'/60'/0'/0/${i}`, i, this.config.balanceCfx));
    }
    // Mining branch (`44'/60'/1'/...`) keeps the faucet key out of the user
    // account index space.
    this.faucet = this.makeAccount("m/44'/60'/1'/0/0", 0, this.config.balanceCfx);
  }

  private makeAccount(path: string, index: number, balanceCfx: string): DevNodeAccount {
    const { account, privateKey } = deriveAccount({ mnemonic: this.config.mnemonic, path });
    return {
      index,
      evmAddress: account.address,
      coreAddress: coreAddressFromPrivateKey(privateKey, this.config.chainId),
      publicKey: account.publicKey,
      privateKey: privateKey,
      paths: { evm: path, core: path },
      initialBalanceCfx: balanceCfx,
    };
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

  /**
   * Boot the underlying `@xcfx/node` server. Starts the auto-miner unless
   * `miningIntervalMs` was set to `0`.
   */
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

      // xcfx hardcodes the per-genesis-account balance at 10_000 CFX (see
      // `genesisSecrets` doc in @xcfx/node's conflux.d.ts). We keep
      // `balanceCfx` on the config object so callers can display the figure,
      // but we don't pass it through — there's no xcfx field for it.

      const genesisSecrets = [...this.accounts.map((a) => a.privateKey), this.faucet.privateKey];

      const xcfx = await import('@xcfx/node');
      const serverConfig: Record<string, unknown> = {
        jsonrpcHttpPort: this.config.coreRpcPort,
        jsonrpcHttpEthPort: this.config.evmRpcPort,
        jsonrpcWsPort: this.config.coreWsPort,
        jsonrpcWsEthPort: this.config.evmWsPort,
        chainId: this.config.chainId,
        evmChainId: this.config.evmChainId,
        confluxDataDir: this.config.dataDir,
        genesisSecrets,
        genesisEvmSecrets: genesisSecrets,
        miningAuthor: this.faucet.coreAddress,
        // mine({ numTxs:1 }) is the only call that packs both spaces.
        devPackTxImmediately: false,
        log: this.config.logging,
        timeout: 60_000,
        retryInterval: 300,
      };

      const created = await xcfx.createServer(serverConfig);
      this.server = created as unknown as XcfxServer;
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

  /**
   * Mine `blocks` empty Core blocks. Does NOT pack pending txs (use
   * {@link packMine} or the auto-miner for that).
   */
  async mine(blocks = 1): Promise<void> {
    this.assertRunning();
    const client = await this.requireTestClient();
    await client.mine({ blocks });
  }

  /**
   * `mine({ numTxs: 1 })` — packs all pending Core *and* eSpace transactions
   * into the next block, then advances `deferredStateEpochCount` (default 5)
   * empty blocks so the receipt is observable via JSON-RPC.
   */
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

  /**
   * Begin auto-mining. Each tick calls {@link packMine}. Only one auto-miner
   * may run at a time. Already-mining is a no-op when `intervalMs` matches.
   */
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
    const cive = await import('cive');
    this.testClient = cive.createTestClient({
      transport: cive.http(this.urls.core, { timeout: 60_000 }),
    }) as unknown as CiveTestClient;
    return this.testClient;
  }
}

/** Construct a {@link DevNode} with default ports / accounts. */
export function createDevNode(config: DevNodeConfig = {}): DevNode {
  return new DevNode(config);
}
