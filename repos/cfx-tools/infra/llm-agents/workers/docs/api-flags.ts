export type DocsApiFlags = {
  quick?: boolean;
  model?: string;
  yes?: boolean;
  package?: string;
  precheck?: boolean;
  force?: boolean;
  noThinking?: boolean;
};

export function parseDocsApiFlags(args: string[]): DocsApiFlags {
  const flags: DocsApiFlags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--quick') flags.quick = true;
    if (args[i] === '--no-thinking') flags.noThinking = true;
    if (args[i] === '--yes' || args[i] === '-y') flags.yes = true;
    if (args[i] === '--force' || args[i] === '-f') flags.force = true;
    if (args[i] === '--precheck') flags.precheck = true;
    if (args[i] === '--model' && args[i + 1]) {
      flags.model = args[++i];
    }
    if (args[i] === '--package' && args[i + 1]) {
      flags.package = args[++i];
    }
  }
  return flags;
}