import type { DocsCommandName } from './scripts.js';

export interface DocsCliCommandDefinition {
  readonly name: string;
  readonly description: string;
  readonly usage?: string;
}

export const docsCommands: readonly DocsCliCommandDefinition[] = [
  {
    name: 'sync',
    description: 'Sync generated docs content',
    usage: 'sync [all|packages|wiki|architecture|coverage]',
  },
  {
    name: 'validate',
    description: 'Validate generated docs content',
    usage: 'validate [content|wiki|wiki-fix]',
  },
  {
    name: 'wiki',
    description: 'Run wiki regeneration/update flow',
    usage: 'wiki [extra args passed through]',
  },
];

export function findDocsCommand(name: string): DocsCliCommandDefinition | undefined {
  return docsCommands.find((command) => command.name === name);
}

export function resolveDocsInvocation(
  commandName: string,
  args: readonly string[],
): { command: DocsCommandName; extraArgs: readonly string[] } {
  if (commandName === 'sync') {
    const target = normalizeTarget(args[0], [
      'all',
      'packages',
      'wiki',
      'architecture',
      'coverage',
    ]);
    const command: DocsCommandName =
      target === 'all'
        ? 'sync:all'
        : target === 'packages'
          ? 'sync:packages'
          : target === 'wiki'
            ? 'sync:wiki'
            : target === 'architecture'
              ? 'sync:architecture'
              : 'sync:coverage';
    return { command, extraArgs: [] };
  }

  if (commandName === 'validate') {
    const target = normalizeTarget(args[0], ['content', 'wiki', 'wiki-fix']);
    const command: DocsCommandName =
      target === 'content'
        ? 'validate:content'
        : target === 'wiki'
          ? 'validate:wiki'
          : 'validate:wiki-fix';
    return { command, extraArgs: [] };
  }

  if (commandName === 'wiki' || commandName === 'update-wiki') {
    return { command: 'update-wiki', extraArgs: args };
  }

  throw new Error(`Unknown docs-pipeline command: ${commandName}`);
}

function normalizeTarget(target: string | undefined, valid: readonly string[]): string {
  if (!target) return valid[0] ?? '';
  if (valid.includes(target)) return target;
  throw new Error(`Invalid target "${target}". Expected one of: ${valid.join(', ')}`);
}
