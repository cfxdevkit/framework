import { Command, CommanderError } from 'commander';
import type { ToolingNamespaceDefinition } from './contracts.js';
import {
  buildToolingCatalog,
  findToolingCommand,
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

  if (args.length === 0 || isHelpToken(args[0] ?? '')) {
    stdout.write(formatToolingHelp(namespaces));
    return;
  }

  const cli = buildCli(namespaces, stdout, stderr);

  try {
    await cli.parseAsync(args, { from: 'user' });
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.code === 'commander.helpDisplayed') return;
      if (error.code === 'commander.unknownCommand') {
        const unknown = error.message.match(/unknown command '([^']+)'/)?.[1] ?? args[0] ?? 'help';
        stderr.write(`Unknown tooling namespace: ${unknown}\n\n`);
        stdout.write(formatToolingHelp(namespaces));
        process.exitCode = 1;
        return;
      }
    }
    throw error;
  }
}

function buildCli(
  namespaces: readonly ToolingNamespaceDefinition[],
  stdout: Pick<NodeJS.WriteStream, 'write'>,
  stderr: Pick<NodeJS.WriteStream, 'write'>,
): Command {
  const cli = new Command();
  cli.name('cdk');
  cli.exitOverride();
  cli.showHelpAfterError(false);
  cli.configureOutput({
    writeOut: (message) => stdout.write(message),
    writeErr: (message) => stderr.write(message),
  });

  cli
    .command('catalog')
    .description('Print the tooling command catalog as JSON')
    .action(() => {
      stdout.write(`${JSON.stringify(buildToolingCatalog(namespaces), null, 2)}\n`);
    });

  for (const namespace of namespaces) {
    const command = cli.command(namespace.name).description(namespace.description);
    command.allowUnknownOption(true);
    command.helpOption(false);
    command.argument('[command]');
    command.argument('[args...]');
    command.action(async (commandName?: string, forwardedArgs: string[] = []) => {
      while (forwardedArgs[0] === '--') forwardedArgs.shift();

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
    });
  }

  return cli;
}

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}
