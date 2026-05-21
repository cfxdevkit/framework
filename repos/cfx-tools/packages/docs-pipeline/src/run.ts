import { runCommand, type DocsCommandName } from './scripts.js';

const helpText = `Usage: pnpm --filter @cfxdevkit/docs-pipeline run docs -- <command>

Commands:
  sync [all|packages|wiki|architecture|coverage]
  validate [content|wiki|wiki-fix]
  wiki [extra args passed through]
`;

export async function runCli(rawArgs: readonly string[]): Promise<void> {
  const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;
  const [command = 'help', ...rest] = args;

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(helpText);
    return;
  }

  if (command === 'sync') {
    const target = normalizeTarget(rest[0], [
      'all',
      'packages',
      'wiki',
      'architecture',
      'coverage',
    ]);
    const mapped: DocsCommandName =
      target === 'all'
        ? 'sync:all'
        : target === 'packages'
          ? 'sync:packages'
          : target === 'wiki'
            ? 'sync:wiki'
            : target === 'architecture'
              ? 'sync:architecture'
              : 'sync:coverage';
    await runCommand(mapped);
    return;
  }

  if (command === 'validate') {
    const target = normalizeTarget(rest[0], ['content', 'wiki', 'wiki-fix']);
    const mapped: DocsCommandName =
      target === 'content'
        ? 'validate:content'
        : target === 'wiki'
          ? 'validate:wiki'
          : 'validate:wiki-fix';
    await runCommand(mapped);
    return;
  }

  if (command === 'wiki' || command === 'update-wiki') {
    await runCommand('update-wiki', rest);
    return;
  }

  console.error(`Unknown docs-pipeline command: ${command}`);
  console.log(helpText);
  process.exitCode = 1;
}

function normalizeTarget(target: string | undefined, valid: readonly string[]): string {
  if (!target) return valid[0] ?? '';
  if (valid.includes(target)) return target;
  throw new Error(`Invalid target "${target}". Expected one of: ${valid.join(', ')}`);
}
