import { compile, getTemplate, listTemplates } from '@cfxdevkit/compiler';
import { createClient, espaceLocal, http, signerFromPrivateKey } from '@cfxdevkit/core';
import { getNodeSingleton } from './node.js';

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

function errText(content: string) {
  return { isError: true as const, content: [{ type: 'text' as const, text: content }] };
}

export async function handleCompilerTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ isError?: true; content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'cfxdevkit_compiler_list_templates': {
      const templates = listTemplates().map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        contractName: t.contractName,
        solcVersion: t.solcVersion,
      }));
      return text(JSON.stringify(templates, null, 2));
    }

    case 'cfxdevkit_compiler_get_template': {
      const id = String(args.id ?? '');
      try {
        const tmpl = getTemplate(id);
        return text(
          JSON.stringify(
            {
              id: tmpl.id,
              name: tmpl.name,
              contractName: tmpl.contractName,
              solcVersion: tmpl.solcVersion,
              sources: tmpl.sources,
            },
            null,
            2,
          ),
        );
      } catch (err) {
        return errText(`Template not found: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    case 'cfxdevkit_compiler_compile_solidity': {
      const source = String(args.source ?? '');
      const contractName = args.contractName ? String(args.contractName) : undefined;
      const solcVersion = String(args.solcVersion ?? '0.8.20');
      if (!source) return errText('source is required.');

      try {
        const output = await compile({
          sources: [{ path: 'Input.sol', content: source }],
          solcVersion,
        });

        const artifacts = contractName
          ? output.artifacts.filter((a) => a.contractName === contractName)
          : output.artifacts;

        return text(
          JSON.stringify(
            {
              success: true,
              solcVersion: output.solcVersion,
              warnings: output.warnings.map((d) => d.message),
              contracts: Object.fromEntries(
                artifacts.map((a) => [a.contractName, { abi: a.abi, bytecode: a.bytecode }]),
              ),
            },
            null,
            2,
          ),
        );
      } catch (err) {
        return errText(`Compilation failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    case 'cfxdevkit_compiler_compile_and_deploy': {
      const node = getNodeSingleton();
      if (!node || node.getStatus() !== 'running') {
        return errText('Node is not running. Run cfxdevkit_node_start first.');
      }

      const source = String(args.source ?? '');
      const contractName = String(args.contractName ?? '');
      const solcVersion = String(args.solcVersion ?? '0.8.20');

      if (!source || !contractName) {
        return errText('source and contractName are required.');
      }

      try {
        const output = await compile({
          sources: [{ path: 'Input.sol', content: source }],
          solcVersion,
        });

        const artifact = output.artifacts.find((a) => a.contractName === contractName);
        if (!artifact) {
          return errText(
            `Contract "${contractName}" not found. ` +
              `Available: ${output.artifacts.map((a) => a.contractName).join(', ')}`,
          );
        }

        const bytecode = artifact.bytecode;
        if (!bytecode || bytecode === '0x') return errText('Compilation produced empty bytecode.');

        const account = node.accounts[0];
        if (!account) return errText('No accounts available on devnode.');
        const signer = signerFromPrivateKey(account.privateKey);
        const client = createClient({ chain: espaceLocal, transport: http() });

        const signedTx = await signer.signTransaction({
          data: bytecode,
          chainId: espaceLocal.id,
        });
        const txHash = await client.sendRawTransaction(signedTx);
        await node.mine(1);

        const { createPublicClient, http: viemHttp } = await import('viem');
        const rpcUrl = espaceLocal.rpc.http[0] ?? 'http://127.0.0.1:8545';
        const viemClient = createPublicClient({ transport: viemHttp(rpcUrl) });
        const receipt = await viemClient.getTransactionReceipt({ hash: txHash });

        return text(
          JSON.stringify(
            {
              success: true,
              contractName,
              txHash,
              contractAddress: receipt?.contractAddress ?? null,
              abi: artifact.abi,
            },
            null,
            2,
          ),
        );
      } catch (err) {
        return errText(
          `Compile and deploy failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    default:
      return errText(`Unknown compiler tool: ${name}`);
  }
}
