import type { TemplateTarget } from './templates.js';

export interface ParsedArgs {
  positional?: string[];
  template?: string;
  target?: TemplateTarget;
  force?: true;
  skipInstall?: true;
}

export function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};
  const positional: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === undefined) continue;
    if (arg === '-t' || arg === '--template') {
      const template = args[++index];
      if (template) parsed.template = template;
    } else if (arg === '--target') {
      const target = args[++index] as TemplateTarget | undefined;
      if (target) parsed.target = target;
    } else if (arg === '--force') {
      parsed.force = true;
    } else if (arg === '--skip-install' || arg === '--skipInstall') {
      parsed.skipInstall = true;
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }
  if (positional.length > 0) parsed.positional = positional;
  return parsed;
}
