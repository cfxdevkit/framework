import { docsToolingNamespace } from '@cfxdevkit/docs-pipeline';
import type { ToolingCommandDefinition, ToolingNamespaceDefinition } from '../contracts.js';

const docsCommands: readonly ToolingCommandDefinition[] = [
  {
    name: 'generate',
    description: 'Run deterministic doc generation (skeleton only, no LLM)',
    usage: 'generate [all|api|readme|structure|packages]',
  },
  {
    name: 'validate',
    description: 'Validate docs build, wiki sync, image, and deploy flow',
    usage: 'validate [content|packages|wiki|all] [args]',
  },
];

const helpText = `Usage: cdk docs <command> [args]
       pnpm cdk -- docs <command> [args]

Deterministic commands:
${docsToolingNamespace.commands.map((command) => `  ${command.usage ?? command.name}`).join('\n')}

Generation (deterministic, idempotent):
  generate [all|api|readme|structure|packages]

Validation:
  validate [content|packages|wiki|all] [args]

Examples:
  cdk docs generate all
  cdk docs generate api
  cdk docs validate wiki
  cdk docs validate content
`;

export const rootDocsToolingNamespace: ToolingNamespaceDefinition = {
  name: 'docs',
  description: 'Docs workflows: deterministic generation and validation',
  commands: [...docsToolingNamespace.commands, ...docsCommands],
  async run(rawArgs) {
    const args = [...rawArgs];
    while (args[0] === '--') args.shift();
    const [command = 'help', ...rest] = args;

    if (isHelpToken(command)) {
      console.log(helpText);
      return;
    }

    if (command === 'generate') {
      const [target = 'all', ...forwardedArgs] = rest;
      if (isHelpToken(target)) {
        console.log(helpText);
        return;
      }
      if (target === 'all') {
        // Run all generate targets in deterministic order
        const { runRepoCommand, renderRepoResult } = await import('../repo-check-runtime.js');
        const generateAll: import('../repo-check-runtime.js').RepoCommandTarget[] = [
          'generate-api',
          'generate-readme',
          'generate-structure',
          'generate-unit-configs',
        ];
        for (const t of generateAll) {
          const result = await runRepoCommand(
            t,
            forwardedArgs.filter((a) => a !== '--json'),
          );
          console.log(await renderRepoResult(result));
          if ((result.exitCode ?? 0) !== 0) {
            process.exitCode = result.exitCode;
            return;
          }
        }
        // Also sync package MDX stubs
        await docsToolingNamespace.run(['sync', 'packages']);
        return;
      }

      if (target === 'packages') {
        await docsToolingNamespace.run(['sync', 'packages']);
        return;
      }

      const singleTargetMap: Record<string, import('../repo-check-runtime.js').RepoCommandTarget> =
        {
          api: 'generate-api',
          readme: 'generate-readme',
          structure: 'generate-structure',
          'unit-configs': 'generate-unit-configs',
        };
      const mappedTarget = singleTargetMap[target];
      if (!mappedTarget) {
        console.error(
          `Unknown generate target: ${target}. Valid: all|api|readme|structure|packages`,
        );
        process.exitCode = 1;
        return;
      }
      const { runRepoCommand, renderRepoResult } = await import('../repo-check-runtime.js');
      const result = await runRepoCommand(
        mappedTarget,
        forwardedArgs.filter((a) => a !== '--json'),
      );
      console.log(await renderRepoResult(result));
      process.exitCode = result.exitCode ?? 0;
      return;
    }

    // For validate and other commands from docsToolingNamespace, delegate directly
    await docsToolingNamespace.run([command, ...rest]);
  },
};

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}
