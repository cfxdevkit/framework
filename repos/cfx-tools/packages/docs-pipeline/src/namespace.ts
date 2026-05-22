import { docsCommands } from './commands.js';
import { runCli } from './run.js';

export const docsToolingNamespace = {
  name: 'docs',
  description: 'Docs pipeline workflows',
  commands: docsCommands,
  run: runCli,
} as const;
