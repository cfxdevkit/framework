import { agentToolingNamespace } from './agent-namespace.js';
import type {
  ToolingCatalog,
  ToolingCommandDefinition,
  ToolingNamespaceDefinition,
} from './contracts.js';
import { devnodeToolingNamespace } from './devnode-namespace.js';
import { rootDocsToolingNamespace } from './docs-namespace.js';
import { llmToolingNamespace } from './llm-namespace.js';
import { repoToolingNamespace } from './repo-namespace.js';
import { signToolingNamespace } from './sign-namespace.js';
import { signerToolingNamespace } from './signer-namespace.js';

export { agentToolingNamespace, llmToolingNamespace, repoToolingNamespace };

export const toolingNamespaces = [
  repoToolingNamespace,
  agentToolingNamespace,
  llmToolingNamespace,
  rootDocsToolingNamespace,
  devnodeToolingNamespace,
  signToolingNamespace,
  signerToolingNamespace,
] as const satisfies readonly ToolingNamespaceDefinition[];

export function findToolingNamespace(
  name: string,
  namespaces: readonly ToolingNamespaceDefinition[] = toolingNamespaces,
): ToolingNamespaceDefinition | undefined {
  return namespaces.find((namespace) => namespace.name === name);
}

export function findToolingCommand(
  namespace: ToolingNamespaceDefinition,
  name: string,
): ToolingCommandDefinition | undefined {
  return namespace.commands.find((command) => command.name === name);
}

export function buildToolingCatalog(
  namespaces: readonly ToolingNamespaceDefinition[] = toolingNamespaces,
): ToolingCatalog {
  return {
    namespaces: namespaces.map((namespace) => ({
      name: namespace.name,
      description: namespace.description,
      commands: namespace.commands
        .filter((command) => command.hidden !== true)
        .map((command) => ({
          name: command.name,
          description: command.description,
          ...(command.usage ? { usage: command.usage } : {}),
        })),
    })),
  };
}

export function formatToolingHelp(
  namespaces: readonly ToolingNamespaceDefinition[] = toolingNamespaces,
): string {
  const namespaceBlock = namespaces
    .map((namespace) => `  ${namespace.name.padEnd(8)} ${namespace.description}`)
    .join('\n');
  const commandBlocks = namespaces
    .map(
      (namespace) =>
        `${namespace.name}:\n${namespace.commands
          .filter((command) => command.hidden !== true)
          .map((command) => {
            const summary = `  ${command.name.padEnd(14)} ${command.description}`;
            if (!command.usage) return summary;
            return `${summary}\n${' '.repeat(18)}usage: ${namespace.name} ${command.usage}`;
          })
          .join('\n')}`,
    )
    .join('\n\n');

  return `Usage:
  cdk <namespace> <command> [args]
  pnpm cdk -- <namespace> <command> [args]

Namespaces:
${namespaceBlock}

Global commands:
  help      Show this help text
  catalog   Print the tooling command catalog as JSON

Commands by namespace:
${commandBlocks}
`;
}
