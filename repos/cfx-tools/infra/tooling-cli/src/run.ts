import { Writable } from 'node:stream';
import { Cli, Command, Option, type CommandClass } from 'clipanion';
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

  if (args.length === 0 || isHelpToken(args[0] ?? '')) {
    stdout.write(formatToolingHelp(namespaces));
    return;
  }

  const [namespaceName] = args;
  if (namespaceName !== 'catalog' && !findToolingNamespace(namespaceName ?? '', namespaces)) {
    stderr.write(`Unknown tooling namespace: ${namespaceName ?? 'help'}\n\n`);
    stdout.write(formatToolingHelp(namespaces));
    process.exitCode = 1;
    return;
  }

  const cli = buildCli(namespaces);
  process.exitCode = await cli.run(args, {
    stdin: process.stdin,
    stdout: toWritable(stdout),
    stderr: toWritable(stderr),
    env: process.env,
    colorDepth:
      typeof process.stdout.getColorDepth === 'function' ? process.stdout.getColorDepth() : 1,
  });
}

function buildCli(namespaces: readonly ToolingNamespaceDefinition[]): Cli {
  const cli = new Cli({
    binaryLabel: 'cdk',
    binaryName: 'cdk',
  });

  cli.register(createCatalogCommand(namespaces));

  for (const namespace of namespaces) {
    cli.register(createNamespaceCommand(namespace));
  }

  return cli;
}

function createCatalogCommand(namespaces: readonly ToolingNamespaceDefinition[]): CommandClass {
  return class CatalogCommand extends Command {
    static override paths = [['catalog']];

    async execute(): Promise<number> {
      this.context.stdout.write(`${JSON.stringify(buildToolingCatalog(namespaces), null, 2)}\n`);
      return 0;
    }
  };
}

function createNamespaceCommand(namespace: ToolingNamespaceDefinition): CommandClass {
  return class NamespaceCommand extends Command {
    static override paths = [[namespace.name]];

    readonly forwardedArgs = Option.Proxy();

    async execute(): Promise<number> {
      const args = [...this.forwardedArgs];
      while (args[0] === '--') args.shift();

      const [commandName, ...rest] = args;
      if (!commandName || isHelpToken(commandName)) {
        await namespace.run(['help']);
        return 0;
      }

      if (!findToolingCommand(namespace, commandName)) {
        this.context.stderr.write(`Unknown ${namespace.name} command: ${commandName}\n\n`);
        await namespace.run(['help']);
        return 1;
      }

      await namespace.run([commandName, ...rest]);
      return 0;
    }
  };
}

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}

function toWritable(target: Pick<NodeJS.WriteStream, 'write'>): Writable {
  if (target instanceof Writable) {
    return target;
  }

  return new Writable({
    write(chunk, _encoding, callback) {
      target.write(typeof chunk === 'string' ? chunk : chunk.toString());
      callback();
    },
  });
}
