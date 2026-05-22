import { llmCommands } from './commands.js';
import { runCli } from './run.js';

export const llmToolingNamespace = {
  name: 'llm',
  description: 'Local LLM automation workflows',
  commands: llmCommands.map(({ name, description }) => ({ name, description })),
  run: runCli,
} as const;