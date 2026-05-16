import { deployContract } from '@cfxdevkit/contracts/deploy';
import { Hono } from 'hono';
import type { Abi } from 'viem';
import { type ContractRegistry, chainIdForContractNetwork } from '../contracts.js';
import type { DevnodeServerController } from '../controller.js';
import type { KeystoreService } from '../keystore.js';
import type { NetworkState } from '../network.js';
import {
  createRuntimeClient,
  resolveNetworkContext,
  resolveRouteSigner,
  signerAddress,
} from '../runtime-operations.js';

type NetworkId = 'local' | 'mainnet' | 'testnet';
type SpaceId = 'core' | 'espace';

interface DeployRequest {
  accountIndex?: number;
  abi?: unknown[];
  args?: unknown[];
  bytecode?: string;
  contractName?: string;
  network?: NetworkId;
  privateKey?: string;
  space?: SpaceId;
}

export function createDeployRoutes(
  controller: DevnodeServerController,
  keystore: KeystoreService,
  registry: ContractRegistry,
  networkState: NetworkState,
): Hono {
  const app = new Hono();

  app.post('/run', async (context) => {
    const body = await readBody<DeployRequest>(context);
    if (!Array.isArray(body.abi)) {
      return context.json({ ok: false, error: 'abi must be an array' }, 400);
    }
    if (!body.bytecode?.startsWith('0x')) {
      return context.json({ ok: false, error: 'bytecode must be a 0x-prefixed hex string' }, 400);
    }

    const space = normalizeSpace(body.space) ?? 'espace';
    const runtime = resolveNetworkContext(networkState, body.network);

    let signer: Awaited<ReturnType<typeof resolveRouteSigner>>;
    try {
      signer = await resolveRouteSigner({
        context: runtime,
        keystore,
        space,
        ...(body.accountIndex === undefined ? {} : { accountIndex: body.accountIndex }),
        ...(body.privateKey === undefined ? {} : { requestPrivateKey: body.privateKey }),
      });
    } catch (error) {
      return context.json(
        { ok: false, error: error instanceof Error ? error.message : String(error) },
        409,
      );
    }

    try {
      const client = createRuntimeClient(controller, runtime, space);
      const input = {
        abi: body.abi as Abi,
        bytecode: body.bytecode as `0x${string}`,
        client,
        signer: signer.signer,
        waitForReceipt: true,
      };
      const result = await deployContract(
        Array.isArray(body.args) ? { ...input, args: body.args as never } : input,
      );

      let contractId: string | null = null;
      if (result.address) {
        const contract = await registry.register({
          abi: body.abi,
          address: result.address,
          chainId:
            runtime.network === normalizeNetwork(body.network)
              ? space === 'core'
                ? runtime.chainIds.core
                : runtime.chainIds.espace
              : chainIdForContractNetwork(runtime.network, space),
          constructorArgs: Array.isArray(body.args) ? body.args : [],
          deployer: signerAddress(signer.signer, space),
          metadata: {
            mode: runtime.mode,
            ...(runtime.mode === 'public'
              ? {
                  rpcUrl: space === 'core' ? runtime.config.coreRpc : runtime.config.espaceRpc,
                  signerAccountIndex: signer.accountIndex,
                  signerSource: signer.source,
                }
              : {}),
          },
          name: body.contractName?.trim() || 'Showcase Contract',
          network: runtime.network,
          space,
          txHash: result.hash,
        });
        contractId = contract.id;
      }

      const receipt = result.receipt;

      return context.json({
        address: result.address ?? null,
        ...(contractId ? { contractId } : {}),
        hash: result.hash,
        mode: runtime.mode,
        network: runtime.network,
        ok: true,
        receipt: receipt
          ? {
              blockHash: receipt.blockHash ?? null,
              blockNumber: receipt.blockNumber !== undefined ? String(receipt.blockNumber) : null,
              status: receipt.status ?? null,
              transactionHash: receipt.transactionHash ?? null,
            }
          : null,
        ...(runtime.mode === 'public'
          ? {
              signerAccountIndex: signer.accountIndex,
              signerSource: signer.source,
            }
          : {}),
        space,
      });
    } catch (error) {
      return context.json(
        { ok: false, error: error instanceof Error ? error.message : String(error) },
        400,
      );
    }
  });

  return app;
}

function normalizeNetwork(value?: string): NetworkId | null {
  if (value === 'local' || value === 'testnet' || value === 'mainnet') {
    return value;
  }

  return null;
}

function normalizeSpace(value?: string): SpaceId | null {
  if (value === 'core' || value === 'espace') {
    return value;
  }

  return null;
}

async function readBody<T>(context: { req: { json: () => Promise<unknown> } }): Promise<T> {
  try {
    const body = await context.req.json();
    return (body && typeof body === 'object' ? body : {}) as T;
  } catch {
    return {} as T;
  }
}
