/**
 * Shared flag parser for all docs worker commands.
 * Replaces 4 duplicated manual parsers in api.ts, readme.ts, structure.ts, packages.ts.
 */

export type DocFlagField =
  | 'quick'
  | 'model'
  | 'force'
  | 'package'
  | 'no-thinking'
  | 'yes'
  | 'precheck';

export type DocFlags = {
  quick: boolean;
  model?: string;
  force: boolean;
  package?: string;
  noThinking: boolean;
  yes: boolean;
  precheck: boolean;
};

export function parseDocFlags(args: string[], _fields?: DocFlagField[]): DocFlags {
  const flags: DocFlags = {
    quick: false,
    force: false,
    noThinking: false,
    yes: false,
    precheck: false,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--quick') flags.quick = true;
    else if (arg === '--no-thinking') flags.noThinking = true;
    else if (arg === '--yes' || arg === '-y') flags.yes = true;
    else if (arg === '--force' || arg === '-f') flags.force = true;
    else if (arg === '--precheck') flags.precheck = true;
    else if (arg === '--model' && args[i + 1]) flags.model = args[++i];
    else if (arg === '--package' && args[i + 1]) flags.package = args[++i];
  }
  return flags;
}
