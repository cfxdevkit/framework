import type { ToolingNamespaceDefinition } from './contracts.js';
import {
  buildToolingCatalog,
  findToolingCommand,
  findToolingNamespace,
  formatToolingHelp,
  toolingNamespaces,
} from './registry.js';

export interface RunCliOptions {
  readonly namespaces?: readonly ToolingNamespaceDefinition[];
  readonly stdout?: Pick<NodeJS.WriteStream, 'write'>;
  readonly stderr?: Pick<NodeJS.WriteStream, 'write'>;
}

export async function runCli(rawArgs: readonly string[], opts: RunCliOptions = {}): Promise<void> {
  const namespaces = opts.namespaces ?? toolingNamespaces;
  const stdout = opts.stdout ?? process.stdout;
  const stderr = opts.stderr ?? process.stderr;
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();
  const [namespaceName = 'help', ...rest] = args;

  if (isHelpToken(namespaceName)) {
    stdout.write(formatToolingHelp(namespaces));
    return;
  }

  if (namespaceName === 'catalog') {
    stdout.write(`${JSON.stringify(buildToolingCatalog(namespaces), null, 2)}\n`);
    return;
  }

  const namespace = findToolingNamespace(namespaceName, namespaces);
  if (!namespace) {
    stderr.write(`Unknown tooling namespace: ${namespaceName}\n\n`);
    stdout.write(formatToolingHelp(namespaces));
    process.exitCode = 1;
    return;
  }

  while (rest[0] === '--') rest.shift();

  const [commandName, ...forwardedArgs] = rest;
  if (!commandName || isHelpToken(commandName)) {
    await namespace.run(['help']);
    return;
  }

  if (!findToolingCommand(namespace, commandName)) {
    stderr.write(`Unknown ${namespace.name} command: ${commandName}\n\n`);
    process.exitCode = 1;
    await namespace.run(['help']);
    return;
  }

  process.exitCode = 0;
  await namespace.run([commandName, ...forwardedArgs]);
}

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}