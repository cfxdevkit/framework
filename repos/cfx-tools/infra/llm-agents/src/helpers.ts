/**
 * Shared utility functions for @cfxdevkit/llm-agents CLI.
 *
 * Extracted from bin.ts to keep the main entry point under the file size limit.
 */

export function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}

export function normalizeArgs(rawArgs: readonly string[]): string[] {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();
  return args;
}

export function parseScopeFlag(rawArgs: readonly string[]): { args: string[]; scope?: string } {
  const args = [...rawArgs];
  let scope: string | undefined;
  const normalized = normalizeArgs(args);
  const out: string[] = [];
  for (let i = 0; i < normalized.length; i++) {
    if (normalized[i] === '--scope' && i + 1 < normalized.length) {
      scope = normalized[i + 1];
      i++;
    } else {
      out.push(normalized[i]);
    }
  }
  return { args: out, scope };
}

export function parseEndpointOverride(args: string[]): { endpoint: string | null; args: string[] } {
  let endpoint: string | null = null;
  const out: string[] = [];
  const normalized = normalizeArgs(args);
  for (let i = 0; i < normalized.length; i++) {
    if (normalized[i] === '--endpoint' && i + 1 < normalized.length) {
      endpoint = normalized[i + 1];
      i++;
    } else if (normalized[i] === '--local') {
      // Local endpoint is the default; nothing to set
    } else {
      out.push(normalized[i]);
    }
  }
  return { endpoint, args: out };
}
