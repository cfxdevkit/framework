/**
 * Parser utilities for repo command arguments.
 * Extracted from commands.ts to reduce file size.
 */

export function tokenizeArgs(value: string): string[] {
  const matches = value.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
  return matches.map((token) => token.replace(/^['"]|['"]$/g, ''));
}

export function parseRepoRunArgs(rawArgs: string): {
  action?: string;
  prompt?: string;
  quick?: boolean;
  model?: string;
} {
  const tokens = tokenizeArgs(rawArgs);
  const [action, ...rest] = tokens;
  const promptParts: string[] = [];
  let quick = false;
  let model: string | undefined;

  for (let index = 0; index < rest.length; index++) {
    const token = rest[index];
    if (token === '--quick') {
      quick = true;
      continue;
    }
    if (token === '--model') {
      model = rest[index + 1];
      index += 1;
      continue;
    }
    promptParts.push(token);
  }

  return {
    ...(action ? { action } : {}),
    ...(promptParts.length > 0 ? { prompt: promptParts.join(' ') } : {}),
    ...(quick ? { quick: true } : {}),
    ...(model ? { model } : {}),
  };
}

export function normalizeModeArg(rawArgs: string): 'deterministic' | 'exploratory' | undefined {
  const [first] = tokenizeArgs(rawArgs);
  if (first === 'deterministic' || first === 'exploratory') {
    return first;
  }
  return undefined;
}

export function parseRepoCheckArgs(rawArgs: string): {
  dryRun: boolean;
  createBranch: boolean;
  quick: boolean;
} {
  const tokens = tokenizeArgs(rawArgs);
  return {
    dryRun: tokens.includes('--dry-run'),
    createBranch: tokens.includes('--create-branch'),
    quick: tokens.includes('--quick'),
  };
}
