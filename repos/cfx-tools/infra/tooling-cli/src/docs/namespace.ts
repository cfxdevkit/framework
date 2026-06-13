import { docsToolingNamespace } from '@cfxdevkit/docs-pipeline';
import { agentToolingNamespace } from '../agent/namespace.js';
import type { ToolingCommandDefinition, ToolingNamespaceDefinition } from '../contracts.js';

const docsEnrichmentTargetMap = {
  api: 'docs-api',
  readme: 'readme-upkeep',
  packages: 'package-pages',
  structure: 'structure-upkeep',
} as const;

const docsProbeTargetMap = {
  api: 'docs-api-probe',
} as const;

const docsEnrichmentAllSequence = [
  'docs-api',
  'readme-upkeep',
  'structure-upkeep',
  'package-pages',
] as const;

/** Route a doc enrichment command through the agent deterministic workflow.
 *  Replaces the previous spawn-through-llm-tools path. */
async function runDeterministicEnrichment(command: string, args: readonly string[]): Promise<void> {
  await agentToolingNamespace.run(['deterministic', command, ...args]);
}

/** Route a doc pipeline review through the agent exploratory workflow. */
async function runExploratoryReview(args: readonly string[]): Promise<void> {
  await agentToolingNamespace.run(['exploratory', 'docs-pipeline', ...args]);
}

const docsEnrichmentCommands: readonly ToolingCommandDefinition[] = [
  {
    name: 'generate',
    description: 'Run deterministic doc generation (skeleton only, no LLM)',
    usage: 'generate [all|api|readme|structure|packages]',
  },
  {
    name: 'enrich',
    description: 'Run docs enrichment workflows backed by the local LLM',
    usage: 'enrich [all|api|readme|packages|structure] [args]',
  },
  {
    name: 'probe',
    description: 'Run a small model/data-path probe before a full docs enrichment workflow',
    usage: 'probe api [args]',
  },
  {
    name: 'wiki',
    description: 'GitNexus wiki: generate (LLM), sync MDX, or validate mermaid',
    usage: 'wiki [generate|sync|validate] [args]',
  },
  {
    name: 'review',
    description: 'Review docs build, wiki sync, image, and deploy flow via the local LLM',
    usage: 'review [args]',
  },
];

const helpText = `Usage: cdk docs <command> [args]
       pnpm cdk -- docs <command> [args]

Deterministic commands:
${docsToolingNamespace.commands.map((command) => `  ${command.usage ?? command.name}`).join('\n')}

Generation (deterministic, idempotent):
  generate [all|api|readme|structure|packages]

Enrichment patterns:
  enrich [all|api|readme|packages|structure] [args]
  probe api [args]
  wiki [generate|sync|validate] [args]
  review [args]

Common enrich args pass through to the worker flows: --model <id>, --quick, --force, --no-thinking

Examples:
  cdk docs sync all
  cdk docs validate content
  cdk docs enrich all --quick
  cdk docs enrich all --no-thinking --quick
  cdk docs enrich all --force --quick
  cdk docs enrich api --package @cfxdevkit/executor --precheck
  cdk docs enrich api
  cdk docs probe api --package @cfxdevkit/executor --quick
  cdk docs enrich packages
  cdk docs wiki generate
  cdk docs wiki sync
  cdk docs wiki validate
  cdk docs review
`;

export const rootDocsToolingNamespace: ToolingNamespaceDefinition = {
  name: 'docs',
  description: 'Docs workflows: deterministic pipeline plus LLM enrichment patterns',
  commands: [...docsToolingNamespace.commands, ...docsEnrichmentCommands],
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

    if (command === 'enrich') {
      const [target, ...forwardedArgs] = rest;
      if (!target || isHelpToken(target)) {
        console.log(helpText);
        return;
      }

      if (forwardedArgs.some(isHelpToken)) {
        console.log(helpText);
        return;
      }

      if (target === 'all') {
        await docsToolingNamespace.run(['sync', 'all']);
        for (const mapped of docsEnrichmentAllSequence) {
          await runDeterministicEnrichment(mapped, forwardedArgs);
        }
        return;
      }

      const mapped = docsEnrichmentTargetMap[target as keyof typeof docsEnrichmentTargetMap];
      if (!mapped) {
        console.error(`Unknown docs enrichment target: ${target}`);
        console.log(helpText);
        process.exitCode = 1;
        return;
      }

      await runDeterministicEnrichment(mapped, forwardedArgs);
      return;
    }

    if (command === 'probe') {
      const [target, ...forwardedArgs] = rest;
      if (!target || isHelpToken(target)) {
        console.log(helpText);
        return;
      }

      if (forwardedArgs.some(isHelpToken)) {
        console.log(helpText);
        return;
      }

      const mapped = docsProbeTargetMap[target as keyof typeof docsProbeTargetMap];
      if (!mapped) {
        console.error(`Unknown docs probe target: ${target}`);
        console.log(helpText);
        process.exitCode = 1;
        return;
      }

      await runDeterministicEnrichment(mapped, forwardedArgs);
      return;
    }

    if (command === 'wiki') {
      const [subcommand = 'help', ...forwardedArgs] = rest;
      if (isHelpToken(subcommand)) {
        console.log(helpText);
        return;
      }

      if (subcommand === 'generate') {
        await runDeterministicEnrichment('wiki-generate', forwardedArgs);
        return;
      }
      if (subcommand === 'sync') {
        await docsToolingNamespace.run(['sync', 'wiki']);
        return;
      }
      if (subcommand === 'validate') {
        await docsToolingNamespace.run(['validate', 'wiki', ...forwardedArgs]);
        return;
      }
      console.error(`Unknown wiki subcommand: ${subcommand}. Use: generate, sync, validate`);
      process.exitCode = 1;
      return;
    }

    if (command === 'review') {
      if (rest.some(isHelpToken)) {
        console.log(helpText);
        return;
      }

      await runExploratoryReview(rest);
      return;
    }

    await docsToolingNamespace.run([command, ...rest]);
  },
};

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}
