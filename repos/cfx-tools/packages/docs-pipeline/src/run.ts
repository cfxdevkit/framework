import { docsCommands, findDocsCommand, resolveDocsInvocation } from './commands.js';
import { runCommand } from './scripts.js';

const helpText = `Usage: pnpm --filter @cfxdevkit/docs-pipeline run docs -- <command>

Commands:
${docsCommands.map((command) => `  ${command.usage ?? command.name}`).join('\n')}
`;

export async function runCli(rawArgs: readonly string[]): Promise<void> {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();
  const [command = 'help', ...rest] = args;

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(helpText);
    return;
  }

  if (findDocsCommand(command)) {
    const invocation = resolveDocsInvocation(command, rest);
    if (invocation.extraArgs.length > 0) {
      await runCommand(invocation.command, invocation.extraArgs);
    } else {
      await runCommand(invocation.command);
    }
    return;
  }

  console.error(`Unknown docs-pipeline command: ${command}`);
  console.log(helpText);
  process.exitCode = 1;
}
