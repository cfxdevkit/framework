import { getTemplate, listTemplates } from '@cfxdevkit/compiler';
import { getControlPlaneClient } from '../control-plane.js';

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
      const contractName = args.contractName ? String(args.contractName) : '';
      const solcVersion = String(args.solcVersion ?? '0.8.20');
      if (!source || !contractName) return errText('source and contractName are required.');

      try {
        const artifact = await getControlPlaneClient().compiler.compileSources({
          contractName,
          filename: 'Input.sol',
          source,
          solcVersion,
        });
        return text(
          JSON.stringify(
            {
              success: true,
              warnings: artifact.warnings.map((warning: { message: string }) => warning.message),
              contracts: {
                [artifact.contractName]: { abi: artifact.abi, bytecode: artifact.bytecode },
              },
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
      const source = String(args.source ?? '');
      const contractName = String(args.contractName ?? '');
      const solcVersion = String(args.solcVersion ?? '0.8.20');

      if (!source || !contractName) {
        return errText('source and contractName are required.');
      }

      try {
        const client = getControlPlaneClient();
        const artifact = await client.compiler.compileSources({
          contractName,
          filename: 'Input.sol',
          source,
          solcVersion,
        });
        if (!artifact.bytecode || artifact.bytecode === '0x') {
          return errText('Compilation produced empty bytecode.');
        }
        const deployed = await client.deploy.run({
          abi: artifact.abi,
          bytecode: artifact.bytecode,
          contractName,
          space: 'espace',
        });

        return text(
          JSON.stringify(
            {
              success: true,
              contractName,
              txHash: deployed.hash,
              contractAddress: deployed.address,
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
