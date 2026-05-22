import { llmCommands } from './commands.js';
import { runCli } from './run.js';

export const llmToolingNamespace = {
  name: 'llm',
  description: 'Compatibility CLI for local LLM automation and PI-backed agent modes',
  commands: llmCommands.map(({ name, description }) => ({ name, description })),
  run: runCli,
} as const;
