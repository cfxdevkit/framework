import { docsToolingNamespace } from '@cfxdevkit/docs-pipeline';
import { llmToolingNamespace } from '@cfxdevkit/llm-tools';
import type { ToolingCommandDefinition, ToolingNamespaceDefinition } from './contracts.js';

const docsEnrichmentTargetMap = {
  api: 'docs-api',
  readme: 'readme-upkeep',
  packages: 'package-pages',
  structure: 'structure-upkeep',
  content: 'docs-upkeep',
} as const;

const docsProbeTargetMap = {
  api: 'docs-api-probe',
} as const;

const docsEnrichmentAllSequence = [
  'docs-api',
  'readme-upkeep',
  'structure-upkeep',
  'package-pages',
  'docs-upkeep',
] as const;

const docsEnrichmentCommands: readonly ToolingCommandDefinition[] = [
  {
    name: 'enrich',
    description: 'Run docs enrichment workflows backed by the local LLM',
    usage: 'enrich [all|api|readme|packages|structure|content] [args]',
  },
  {
    name: 'probe',
    description: 'Run a small model/data-path probe before a full docs enrichment workflow',
    usage: 'probe api [args]',
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

Enrichment patterns:
  enrich [all|api|readme|packages|structure|content] [args]
  probe api [args]
  review [args]

Common enrich args pass through to the worker flows: --model <id>, --quick, --force, --no-thinking

Examples:
  cdk docs sync all
  cdk docs validate content
  cdk docs wiki --review
  cdk docs enrich all --quick
  cdk docs enrich all --no-thinking --quick
  cdk docs enrich all --force --quick
  cdk docs enrich api --package @cfxdevkit/executor --precheck
  cdk docs enrich api
  cdk docs probe api --package @cfxdevkit/executor --quick
  cdk docs enrich packages
  cdk docs enrich content --quick
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
          await llmToolingNamespace.run([mapped, ...forwardedArgs]);
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

      await llmToolingNamespace.run([mapped, ...forwardedArgs]);
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

      await llmToolingNamespace.run([mapped, ...forwardedArgs]);
      return;
    }

    if (command === 'review') {
      if (rest.some(isHelpToken)) {
        console.log(helpText);
        return;
      }

      await llmToolingNamespace.run(['docs-pipeline', ...rest]);
      return;
    }

    await docsToolingNamespace.run([command, ...rest]);
  },
};

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}
