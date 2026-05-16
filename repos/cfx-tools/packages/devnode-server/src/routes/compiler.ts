import { compile } from '@cfxdevkit/compiler';
import { Hono } from 'hono';

interface CompileSourcesRequest {
  contractName?: string;
  filename?: string;
  solcVersion?: string;
  source?: string;
}

export function createCompilerRoutes(): Hono {
  const app = new Hono();

  app.post('/sources', async (context) => {
    const body = await readBody<CompileSourcesRequest>(context);
    const source = body.source?.trim();
    const contractName = body.contractName?.trim();
    const solcVersion = body.solcVersion?.trim() || '0.8.26';

    if (!source) {
      return context.json({ ok: false, error: 'source is required' }, 400);
    }

    if (!contractName) {
      return context.json({ ok: false, error: 'contractName is required' }, 400);
    }

    try {
      const result = await compile({
        evmVersion: 'paris',
        solcVersion,
        sources: [{ content: source, path: body.filename?.trim() || `${contractName}.sol` }],
      });
      const artifact = result.artifacts.find((entry) => entry.contractName === contractName);

      if (!artifact) {
        const found = result.artifacts.map((entry) => entry.contractName).join(', ') || '(none)';
        return context.json(
          {
            ok: false,
            error: `compiled output did not contain ${contractName} (found: ${found})`,
          },
          400,
        );
      }

      return context.json({
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        cached: false,
        contractName: artifact.contractName,
        deployedBytecode: artifact.deployedBytecode,
        inputHash: result.inputHash,
        ok: true,
        warnings: result.warnings,
      });
    } catch (error) {
      return context.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        400,
      );
    }
  });

  return app;
}

async function readBody<T>(context: { req: { json: () => Promise<unknown> } }): Promise<T> {
  try {
    const body = await context.req.json();
    return (body && typeof body === 'object' ? body : {}) as T;
  } catch {
    return {} as T;
  }
}
