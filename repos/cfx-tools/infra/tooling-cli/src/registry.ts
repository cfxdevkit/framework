import { llmToolingNamespace } from '@cfxdevkit/llm-tools';
import type {
  ToolingCatalog,
  ToolingCommandDefinition,
  ToolingNamespaceDefinition,
} from './contracts.js';
import { rootDocsToolingNamespace } from './docs-namespace.js';

export const toolingNamespaces = [
  llmToolingNamespace,
  rootDocsToolingNamespace,
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
      commands: namespace.commands.map((command) => ({
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
          .map((command) => `  ${command.name.padEnd(14)} ${command.description}`)
          .join('\n')}`,
    )
    .join('\n\n');

  return `Usage: pnpm run tooling -- <namespace> <command> [args]

Namespaces:
${namespaceBlock}

Global commands:
  help      Show this help text
  catalog   Print the tooling command catalog as JSON

Commands by namespace:
${commandBlocks}
`;
}
