import { rm } from 'node:fs/promises';
import { createDevNode, type DevNode, type DevNodeConfig } from '@cfxdevkit/devnode';
import type {
  DevnodeMineInput,
  DevnodeRestartInput,
  DevnodeServerControllerOptions,
  DevnodeServerStatus,
  DevnodeStartInput,
  DevnodeWipeInput,
} from './types.js';

export class DevnodeServerController {
  readonly #createNode: (config?: DevNodeConfig) => DevNode;
  readonly #removeDataDir: (path: string) => Promise<void>;
  #node: DevNode | null = null;
  #lastConfig: DevNodeConfig = {};

  constructor(options: DevnodeServerControllerOptions = {}) {
    this.#createNode = options.createNode ?? createDevNode;
    this.#removeDataDir = options.removeDataDir ?? removeNodeDataDir;
  }

  status(): DevnodeServerStatus {
    const node = this.#node;
    if (!node) return { status: 'stopped', running: false, accounts: [] };
    return {
      status: node.getStatus(),
      running: node.isRunning(),
      urls: node.urls,
      config: node.config,
      mining: node.getMiningStatus(),
      faucet: node.faucet,
      accounts: node.accounts,
    };
  }

  async start(input: DevnodeStartInput = {}): Promise<DevnodeServerStatus> {
    if (this.#node?.isRunning()) return this.status();
    if (this.#node && this.#node.getStatus() !== 'stopped') await this.#node.stop();
    this.#lastConfig = { ...this.#lastConfig, ...(input.config ?? {}) };
    this.#node = this.#createNode(this.#lastConfig);
    await this.#node.start();
    return this.status();
  }

  async stop(): Promise<DevnodeServerStatus> {
    if (this.#node) await this.#node.stop();
    return this.status();
  }

  async restart(input: DevnodeRestartInput = {}): Promise<DevnodeServerStatus> {
    if (input.config) {
      await this.stop();
      return this.start({ config: input.config });
    }
    if (!this.#node) return this.start();
    await this.#node.restart();
    return this.status();
  }

  async wipe(input: DevnodeWipeInput = {}): Promise<DevnodeServerStatus> {
    const config = { ...this.#lastConfig, ...(input.config ?? {}) };
    const dataDir = this.#node?.config.dataDir ?? config.dataDir;
    await this.stop();
    this.#node = null;
    if (dataDir) await this.#removeDataDir(dataDir);
    this.#lastConfig = config;
    return input.restart ? this.start({ config }) : this.status();
  }

  async mine(input: DevnodeMineInput = {}): Promise<DevnodeServerStatus> {
    if (!this.#node?.isRunning()) throw new Error('dev node is not running');
    if (input.pack) {
      await this.#node.packMine();
    } else {
      const blocks = input.blocks ?? 1;
      if (!Number.isInteger(blocks) || blocks < 1) throw new Error('blocks must be >= 1');
      await this.#node.mine(blocks);
    }
    return this.status();
  }
}

async function removeNodeDataDir(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}
