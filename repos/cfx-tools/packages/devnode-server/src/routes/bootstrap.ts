import { compile, getTemplate, listTemplates } from '@cfxdevkit/compiler';
import {
  createClient,
  type EspaceClient,
  espaceLocal,
  http,
  signerFromPrivateKey,
} from '@cfxdevkit/core';
import { Hono } from 'hono';
import type { ContractRegistry } from '../contracts.js';
import type { DevnodeServerController } from '../controller.js';

export function createBootstrapRoutes(
  controller: DevnodeServerController,
  registry: ContractRegistry,
): Hono {
  const app = new Hono();

  /**
   * GET /bootstrap/catalog
   * Lists all deployable contract templates.
   */
  app.get('/catalog', (c) => {
    const templates = listTemplates().map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      contractName: t.contractName,
      solcVersion: t.solcVersion,
    }));
    return c.json({ ok: true, templates });
  });

  /**
   * GET /bootstrap/catalog/:id
   * Returns the full template including Solidity source.
   */
  app.get('/catalog/:id', (c) => {
    const id = c.req.param('id');
    try {
      const tmpl = getTemplate(id);
      return c.json({
        ok: true,
        template: {
          id: tmpl.id,
          name: tmpl.name,
          description: tmpl.description,
          contractName: tmpl.contractName,
          solcVersion: tmpl.solcVersion,
          source: tmpl.sources[0]?.content,
        },
      });
    } catch {
      return c.json({ ok: false, error: `Template "${id}" not found.` }, 404);
    }
  });

  /**
   * POST /bootstrap/deploy
   * Compiles and deploys a contract template to the local devnode.
   *
   * Body:
   * {
   *   templateId: string,           // compiler template id
   *   constructorArgs?: unknown[],  // optional constructor arguments
   *   senderIndex?: number,         // account index (default: 0)
   * }
   */
  app.post('/deploy', async (c) => {
    const body = await readBody<{
      templateId?: string;
      constructorArgs?: unknown[];
      senderIndex?: number;
    }>(c);

    const { templateId, constructorArgs = [], senderIndex = 0 } = body;

    if (!templateId) {
      return c.json({ ok: false, error: 'templateId is required.' }, 400);
    }

    // Check node is running
    const status = controller.status();
    if (!status.running) {
      return c.json({ ok: false, error: 'Dev node is not running. Start it first.' }, 409);
    }

    // Get template
    let tmpl: ReturnType<typeof getTemplate>;
    try {
      tmpl = getTemplate(templateId);
    } catch {
      return c.json({ ok: false, error: `Template "${templateId}" not found.` }, 404);
    }

    // Get signer account
    const accounts = controller.accounts();
    const account = accounts[senderIndex];
    if (!account) {
      return c.json({ ok: false, error: `Account at index ${senderIndex} not found.` }, 400);
    }

    // Compile
    let artifact: { bytecode: `0x${string}`; abi: unknown[] };
    try {
      const output = await compile({
        sources: [{ path: `${tmpl.contractName}.sol`, content: tmpl.sources[0]?.content ?? '' }],
        solcVersion: tmpl.solcVersion,
      });
      const found = output.artifacts.find((a) => a.contractName === tmpl.contractName);
      if (!found) {
        return c.json(
          {
            ok: false,
            error: `Contract "${tmpl.contractName}" not found in compiled output.`,
          },
          500,
        );
      }
      artifact = { bytecode: found.bytecode, abi: found.abi as unknown[] };
    } catch (err) {
      return c.json(
        {
          ok: false,
          error: `Compilation failed: ${err instanceof Error ? err.message : String(err)}`,
        },
        500,
      );
    }

    // Deploy
    try {
      const signer = signerFromPrivateKey(account.privateKey);
      const client = createClient({ chain: espaceLocal, transport: http() }) as EspaceClient;

      // Build deploy data (bytecode, optionally with encoded ctor args)
      let deployData: `0x${string}` = artifact.bytecode;
      if (constructorArgs.length > 0) {
        const { encodeAbiParameters } = await import('viem');
        const ctorItem = (artifact.abi as Array<{ type: string; inputs?: unknown[] }>).find(
          (x) => x.type === 'constructor',
        );
        if (ctorItem?.inputs && ctorItem.inputs.length > 0) {
          const encoded = encodeAbiParameters(
            ctorItem.inputs as Parameters<typeof encodeAbiParameters>[0],
            constructorArgs,
          );
          deployData = (artifact.bytecode + encoded.slice(2)) as `0x${string}`;
        }
      }

      const signedTx = await signer.signTransaction({
        data: deployData,
        chainId: espaceLocal.id,
      });
      const txHash = await client.sendRawTransaction(signedTx);

      // Mine a block so the contract is included
      await controller.mine({ blocks: 1 });

      // Fetch receipt to get contract address
      const { createPublicClient, http: viemHttp } = await import('viem');
      const rpcUrl = espaceLocal.rpc.http[0] ?? 'http://127.0.0.1:8545';
      const viemClient = createPublicClient({ transport: viemHttp(rpcUrl) });
      const receipt = await viemClient.getTransactionReceipt({ hash: txHash });
      const contractAddress = receipt?.contractAddress ?? null;

      // Register in ContractRegistry if address was obtained
      let contractRecord = null;
      if (contractAddress) {
        contractRecord = registry.register({
          name: tmpl.contractName,
          address: contractAddress,
          abi: artifact.abi,
          space: 'espace',
        });
      }

      return c.json({
        ok: true,
        txHash,
        contractAddress,
        contract: contractRecord,
        templateId,
        contractName: tmpl.contractName,
      });
    } catch (err) {
      return c.json(
        {
          ok: false,
          error: `Deployment failed: ${err instanceof Error ? err.message : String(err)}`,
        },
        500,
      );
    }
  });

  return app;
}

async function readBody<T>(c: { req: { json: () => Promise<unknown> } }): Promise<T> {
  try {
    const body = await c.req.json();
    return (body && typeof body === 'object' ? body : {}) as T;
  } catch {
    return {} as T;
  }
}
