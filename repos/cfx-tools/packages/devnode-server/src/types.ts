import type { DevNode, DevNodeAccount, DevNodeConfig, DevNodeStatus } from '@cfxdevkit/devnode';

export type DevnodeServerNodeFactory = (config?: DevNodeConfig) => DevNode;

export interface DevnodeServerControllerOptions {
  createNode?: DevnodeServerNodeFactory;
  removeDataDir?: (path: string) => Promise<void>;
}

export interface DevnodeStartInput {
  config?: DevNodeConfig;
}

export interface DevnodeRestartInput {
  config?: DevNodeConfig;
}

export interface DevnodeWipeInput {
  restart?: boolean;
  config?: DevNodeConfig;
}

export interface DevnodeMineInput {
  blocks?: number;
  pack?: boolean;
}

export interface DevnodeServerStatus {
  status: DevNodeStatus;
  running: boolean;
  urls?: {
    core: string;
    espace: string;
    coreWs: string;
    espaceWs: string;
  };
  config?: DevNodeConfig & { dataDir?: string };
  mining?: ReturnType<DevNode['getMiningStatus']>;
  faucet?: DevNodeAccount;
  accounts: readonly DevNodeAccount[];
}
