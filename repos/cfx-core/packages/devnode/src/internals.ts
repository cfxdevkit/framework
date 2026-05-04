import { randomBytes } from 'node:crypto';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  coreAddressFromPrivateKey,
  deriveAccount,
  generateMnemonic,
  validateMnemonic,
} from '@cfxdevkit/core';
import { DevNodeError } from './errors.js';
import type { DevNodeAccount, DevNodeConfig } from './types.js';

export const DEFAULTS = {
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

export type ResolvedDevNodeConfig = Required<Omit<DevNodeConfig, 'mnemonic' | 'dataDir'>> & {
  mnemonic: string;
  dataDir: string;
};

export interface XcfxServer {
  start(): Promise<void> | void;
  stop(): Promise<void> | void;
}

export interface CiveTestClient {
  mine(args: { numTxs?: number; blocks?: number }): Promise<unknown>;
}

export function resolveConfig(config: DevNodeConfig): ResolvedDevNodeConfig {
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
  return {
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
}

export function createAccounts(config: ResolvedDevNodeConfig): {
  accounts: DevNodeAccount[];
  faucet: DevNodeAccount;
} {
  const accounts: DevNodeAccount[] = [];
  for (let index = 0; index < config.accounts; index++) {
    accounts.push(makeAccount(config, `m/44'/60'/0'/0/${index}`, index, config.balanceCfx));
  }
  return { accounts, faucet: makeAccount(config, "m/44'/60'/1'/0/0", 0, config.balanceCfx) };
}

function makeAccount(
  config: ResolvedDevNodeConfig,
  path: string,
  index: number,
  balanceCfx: string,
): DevNodeAccount {
  const { account, privateKey } = deriveAccount({ mnemonic: config.mnemonic, path });
  return {
    index,
    evmAddress: account.address,
    coreAddress: coreAddressFromPrivateKey(privateKey, config.chainId),
    publicKey: account.publicKey,
    privateKey,
    paths: { evm: path, core: path },
    initialBalanceCfx: balanceCfx,
  };
}
