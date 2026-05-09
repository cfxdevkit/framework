import {
  AUTOMATION_MANAGER_ADDRESSES,
  GeckoTerminalPriceSource,
  Keeper,
  KeeperClientImpl,
  PriceChecker,
  type PriceSource,
  SafetyGuard,
  SWAPPI_ADDRESSES,
  SWAPPI_ROUTER_ABI,
  SwappiPriceSource,
  type SwappiQuoteReader,
} from '@cfxdevkit/automation';
import {
  createClient,
  type EspaceClient,
  type Hex,
  http,
  signerFromPrivateKey,
  ZERO_ADDRESS,
} from '@cfxdevkit/core';
import { espaceMainnet, espaceTestnet } from '@cfxdevkit/core/chains';
import { decodeFunctionResult, encodeFunctionData } from 'viem';
import type { CasBackendState } from './types.js';

export function createCasWorker(state: CasBackendState): Keeper | null {
  const { config } = state;
  if (!config.keeperEnabled) return null;
  if (!config.signerPrivateKey) {
    throw new Error('KEEPER_ENABLED requires SIGNER_PRIVATE_KEY to be a 0x-prefixed private key');
  }

  const chain = config.network === 'mainnet' ? espaceMainnet : espaceTestnet;
  const client = createClient({ chain, transport: http({ url: config.rpcUrl }) }) as EspaceClient;
  const signer = signerFromPrivateKey(config.signerPrivateKey as Hex);
  const swappiRouter = config.swappiRouterAddress ?? SWAPPI_ADDRESSES[config.network].router;
  const contractAddress =
    config.automationManagerAddress !== ZERO_ADDRESS
      ? config.automationManagerAddress
      : AUTOMATION_MANAGER_ADDRESSES[config.network];

  const safetyGuard = new DatabaseSafetyGuard(state);
  const priceSource = createPriceSource({
    client,
    network: config.network,
    swappiRouter,
    preferred: config.priceSource,
  });

  return new Keeper(
    {
      repository: state.db.jobs,
      executionRepository: state.db.executions,
      priceChecker: new PriceChecker(priceSource),
      safetyGuard,
      keeperClient: new KeeperClientImpl({
        client,
        signer,
        contractAddress,
        swappiRouter,
        maxGasPriceGwei: config.maxGasPriceGwei,
      }),
      onHeartbeat: (lastSeenAt) => {
        state.db.heartbeat.update({ lastSeenAt, workerPid: process.pid });
      },
    },
    { intervalMs: config.keeperIntervalMs, concurrency: config.keeperConcurrency },
  );
}

class DatabaseSafetyGuard extends SafetyGuard {
  constructor(readonly state: CasBackendState) {
    super({ globalPause: state.db.settings.isPaused() });
  }

  override check(...args: Parameters<SafetyGuard['check']>): ReturnType<SafetyGuard['check']> {
    this.updateConfig({ globalPause: this.state.db.settings.isPaused() });
    return super.check(...args);
  }
}

function createPriceSource(options: {
  client: EspaceClient;
  network: 'testnet' | 'mainnet';
  swappiRouter: `0x${string}`;
  preferred: 'gecko_terminal' | 'swappi';
}): PriceSource {
  if (options.preferred === 'gecko_terminal') {
    return new GeckoTerminalPriceSource({ network: 'cfx' });
  }
  return new SwappiPriceSource({
    reader: new EspaceSwappiQuoteReader(options.client, options.swappiRouter),
  });
}

class EspaceSwappiQuoteReader implements SwappiQuoteReader {
  constructor(
    readonly client: EspaceClient,
    readonly router: `0x${string}`,
  ) {}

  async getAmountsOut(
    amountIn: bigint,
    path: readonly [string, string],
  ): Promise<readonly bigint[]> {
    const data = encodeFunctionData({
      abi: SWAPPI_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [amountIn, path as readonly `0x${string}`[]],
    });
    const raw = await this.client.request<`0x${string}`>({
      method: 'eth_call',
      params: [{ to: this.router, data }, 'latest'],
    });
    return decodeFunctionResult({
      abi: SWAPPI_ROUTER_ABI,
      functionName: 'getAmountsOut',
      data: raw,
    });
  }
}
