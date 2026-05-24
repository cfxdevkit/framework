/** Flag extraction helpers for CDK slash command handlers. */

export function tokenize(raw: string): string[] {
  return (raw.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((t) => t.replace(/^['"]|['"]$/g, ''));
}

export function str(flags: Record<string, string | boolean>, key: string): string | undefined {
  const v = flags[key];
  return typeof v === 'string' ? v : undefined;
}

export function num(flags: Record<string, string | boolean>, key: string): number | undefined {
  const v = flags[key];
  if (typeof v !== 'string') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function bool(flags: Record<string, string | boolean>, key: string): boolean {
  return flags[key] === true || flags[key] === 'true';
}
