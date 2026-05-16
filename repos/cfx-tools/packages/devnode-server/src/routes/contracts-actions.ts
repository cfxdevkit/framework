import { readContract } from '@cfxdevkit/contracts/read';
import { sendWrite } from '@cfxdevkit/contracts/write';
import type { Hono } from 'hono';
import { type ContractRecord, type ContractRegistry, detectSpace } from '../contracts.js';
import type { DevnodeServerController } from '../controller.js';
import type { KeystoreService } from '../keystore.js';
import type { NetworkState } from '../network.js';
import {
  createRuntimeClient,
  resolveNetworkContext,
  resolveRouteSigner,
} from '../runtime-operations.js';
import {
  type ContractReadRequest,
  type ContractWriteRequest,
  functionMutability,
  normalizeBlockTag,
  normalizeNetwork,
  readBody,
  toJsonValue,
} from './contracts-helpers.js';

interface ContractRouteServices {
  controller: DevnodeServerController;
  keystore: KeystoreService;
  networkState: NetworkState;
  registry: ContractRegistry;
}

export function attachContractActionRoutes(app: Hono, services: ContractRouteServices): void {
  const { controller, keystore, networkState, registry } = services;

  app.post('/register', async (c) => {
    const body = await readBody<Partial<ContractRecord>>(c);
    if (!body.address) return c.json({ ok: false, error: 'address is required' }, 400);
    if (!body.name) return c.json({ ok: false, error: 'name is required' }, 400);
    if (!Array.isArray(body.abi)) return c.json({ ok: false, error: 'abi must be an array' }, 400);

    const space = body.space ?? detectSpace(body.address);
    const runtime = resolveNetworkContext(networkState, body.network);
    const network = normalizeNetwork(body.network) ?? runtime.network;
    const chainId =
      body.chainId ?? (space === 'core' ? runtime.chainIds.core : runtime.chainIds.espace);
    const contract = await registry.register({
      name: body.name,
      address: body.address,
      abi: body.abi,
      chainId,
      ...(Array.isArray(body.constructorArgs) ? { constructorArgs: body.constructorArgs } : {}),
      ...(typeof body.deployer === 'string' ? { deployer: body.deployer } : {}),
      ...(body.metadata && typeof body.metadata === 'object' ? { metadata: body.metadata } : {}),
      network,
      space,
      ...(typeof body.txHash === 'string' ? { txHash: body.txHash } : {}),
    });
    return c.json({ ok: true, contract }, 201);
  });

  app.post('/read', async (c) => {
    const body = await readBody<ContractReadRequest>(c);
    if (!body.address) return c.json({ ok: false, error: 'address is required' }, 400);
    if (!Array.isArray(body.abi)) return c.json({ ok: false, error: 'abi must be an array' }, 400);
    if (!body.functionName?.trim()) {
      return c.json({ ok: false, error: 'functionName is required' }, 400);
    }

    const runtime = resolveNetworkContext(networkState, body.network);
    const space = body.space ?? detectSpace(body.address);

    try {
      const client = createRuntimeClient(controller, runtime, space);
      const result = await readContract({
        client,
        address: body.address,
        abi: body.abi as never,
        functionName: body.functionName as never,
        ...(Array.isArray(body.args) ? { args: body.args as never } : {}),
        ...(body.blockTag !== undefined ? { blockTag: normalizeBlockTag(body.blockTag) } : {}),
        ...(typeof body.epochTag === 'string' ? { epochTag: body.epochTag as never } : {}),
        ...(typeof body.from === 'string' ? { from: body.from } : {}),
      });
      return c.json({ ok: true, result: toJsonValue(result) });
    } catch (error) {
      return c.json(
        { ok: false, error: error instanceof Error ? error.message : String(error) },
        400,
      );
    }
  });

  app.post('/write', async (c) => {
    const body = await readBody<ContractWriteRequest>(c);
    if (!body.address) return c.json({ ok: false, error: 'address is required' }, 400);
    if (!Array.isArray(body.abi)) return c.json({ ok: false, error: 'abi must be an array' }, 400);
    if (!body.functionName?.trim()) {
      return c.json({ ok: false, error: 'functionName is required' }, 400);
    }

    const runtime = resolveNetworkContext(networkState, body.network);
    const space = body.space ?? detectSpace(body.address);

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
      return c.json(
        { ok: false, error: error instanceof Error ? error.message : String(error) },
        409,
      );
    }

    try {
      const client = createRuntimeClient(controller, runtime, space);
      const result = await sendWrite({
        client,
        signer: signer.signer,
        address: body.address,
        abi: body.abi as never,
        functionName: body.functionName as never,
        ...(Array.isArray(body.args) ? { args: body.args as never } : {}),
        ...(body.value !== undefined ? { value: BigInt(body.value) } : {}),
        waitForReceipt: body.waitForReceipt ?? true,
      });
      return c.json({
        ok: true,
        hash: result.hash,
        receipt: toJsonValue(result.receipt ?? null),
        ...(runtime.mode === 'public'
          ? { signerAccountIndex: signer.accountIndex, signerSource: signer.source }
          : {}),
      });
    } catch (error) {
      return c.json(
        { ok: false, error: error instanceof Error ? error.message : String(error) },
        400,
      );
    }
  });

  app.post('/:id/call', async (c) => {
    const contract = registry.get(c.req.param('id'));
    if (!contract) return c.json({ ok: false, error: 'contract not found' }, 404);

    const body = await readBody<
      Omit<ContractWriteRequest, 'abi' | 'address' | 'network' | 'space'> & {
        functionName?: string;
      }
    >(c);
    if (!body.functionName?.trim()) {
      return c.json({ ok: false, error: 'functionName is required' }, 400);
    }

    const runtime = resolveNetworkContext(networkState, contract.network);
    const mode = functionMutability(contract.abi, body.functionName);
    if (!mode) {
      return c.json(
        { ok: false, error: `function not found in tracked contract ABI: ${body.functionName}` },
        404,
      );
    }

    if (mode === 'read') {
      try {
        const client = createRuntimeClient(controller, runtime, contract.space);
        const result = await readContract({
          client,
          address: contract.address,
          abi: contract.abi as never,
          functionName: body.functionName as never,
          ...(Array.isArray(body.args) ? { args: body.args as never } : {}),
        });
        return c.json({ ok: true, result: toJsonValue(result) });
      } catch (error) {
        return c.json(
          { ok: false, error: error instanceof Error ? error.message : String(error) },
          400,
        );
      }
    }

    let signer: Awaited<ReturnType<typeof resolveRouteSigner>>;
    try {
      signer = await resolveRouteSigner({
        context: runtime,
        keystore,
        space: contract.space,
        ...(body.accountIndex === undefined ? {} : { accountIndex: body.accountIndex }),
        ...(body.privateKey === undefined ? {} : { requestPrivateKey: body.privateKey }),
      });
    } catch (error) {
      return c.json(
        { ok: false, error: error instanceof Error ? error.message : String(error) },
        409,
      );
    }

    try {
      const client = createRuntimeClient(controller, runtime, contract.space);
      const result = await sendWrite({
        client,
        signer: signer.signer,
        address: contract.address,
        abi: contract.abi as never,
        functionName: body.functionName as never,
        ...(Array.isArray(body.args) ? { args: body.args as never } : {}),
        ...(body.value !== undefined ? { value: BigInt(body.value) } : {}),
        waitForReceipt: body.waitForReceipt ?? true,
      });
      return c.json({
        ok: true,
        hash: result.hash,
        receipt: toJsonValue(result.receipt ?? null),
        ...(runtime.mode === 'public'
          ? { signerAccountIndex: signer.accountIndex, signerSource: signer.source }
          : {}),
      });
    } catch (error) {
      return c.json(
        { ok: false, error: error instanceof Error ? error.message : String(error) },
        400,
      );
    }
  });
}
