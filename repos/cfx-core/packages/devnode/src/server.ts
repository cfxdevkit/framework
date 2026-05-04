import type { CiveTestClient, ResolvedDevNodeConfig, XcfxServer } from './internals.js';
import type { DevNodeUrls } from './node.js';
import type { DevNodeAccount } from './types.js';

export async function createXcfxServer(
  config: ResolvedDevNodeConfig,
  accounts: DevNodeAccount[],
  faucet: DevNodeAccount,
): Promise<XcfxServer> {
  const genesisSecrets = [...accounts.map((account) => account.privateKey), faucet.privateKey];
  const xcfx = await import('@xcfx/node');
  const serverConfig: Record<string, unknown> = {
    jsonrpcHttpPort: config.coreRpcPort,
    jsonrpcHttpEthPort: config.evmRpcPort,
    jsonrpcWsPort: config.coreWsPort,
    jsonrpcWsEthPort: config.evmWsPort,
    chainId: config.chainId,
    evmChainId: config.evmChainId,
    confluxDataDir: config.dataDir,
    genesisSecrets,
    genesisEvmSecrets: genesisSecrets,
    miningAuthor: faucet.coreAddress,
    devPackTxImmediately: false,
    log: config.logging,
    timeout: 60_000,
    retryInterval: 300,
  };
  return (await xcfx.createServer(serverConfig)) as unknown as XcfxServer;
}

export async function createMiningClient(urls: DevNodeUrls): Promise<CiveTestClient> {
  const cive = await import('cive');
  return cive.createTestClient({
    transport: cive.http(urls.core, { timeout: 60_000 }),
  }) as unknown as CiveTestClient;
}
