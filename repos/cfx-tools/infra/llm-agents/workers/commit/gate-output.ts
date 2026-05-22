export function extractSignalLines(output: string, maxLines = 8): string[] {
  const filtered = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !line.startsWith('> ') &&
        !/^Done in \d/.test(line) &&
        !/^Tasks:\s+\d+\s+completed/.test(line) &&
        !/^Time:\s/.test(line),
    );
  return filtered.slice(0, maxLines);
}

export function buildDeterministicHints(result: {
  id: string;
  command: string;
  output: string;
}): string[] {
  const hints = new Set<string>();
  if (result.id === 'lint') {
    hints.add(
      'Fix the first reported lint finding before rerunning; later diagnostics are often cascading.',
    );
    if (/assist\/source\/organizeImports/i.test(result.output)) {
      hints.add(
        'Biome is asking for import/export reordering; apply organize-imports or reorder the flagged symbols manually.',
      );
    }
    if (/FIXABLE/i.test(result.output)) {
      hints.add(
        'At least one lint issue is autofixable; run the suggested safe fix or the formatter on the flagged file.',
      );
    }
  }
  if (result.id === 'typecheck') {
    hints.add(
      'Fix the first type error and rerun typecheck; downstream errors are often secondary.',
    );
    if (/TS2307/.test(result.output)) {
      hints.add(
        'A module resolution error is present; check the import path, package export, or tsconfig path mapping.',
      );
    }
  }
  if (result.id === 'test') {
    hints.add('Reproduce the failing test package directly before rerunning the full gate.');
  }
  if (result.id === 'validate:repos') {
    hints.add(
      'The repo contract validator failed; fix the first schema or package-layout violation it reports.',
    );
  }
  if (result.id === 'build') {
    hints.add(
      'A build target failed; rerun the failing project build directly for the complete stack trace.',
    );
  }
  if (result.id === 'hotspots') {
    hints.add('Split or simplify the oversized module until the hotspot hard limit clears.');
  }
  if (result.id === 'kebab-groups') {
    hints.add(
      'Rename grouped sibling files so one kebab prefix does not sprawl across unrelated modules.',
    );
  }
  if (result.id === 'unit-configs') {
    hints.add('Regenerate the scoped unit overlays with `pnpm run gen:unit-configs`.');
  }
  hints.add(`Reproduce with: ${result.command}`);
  return [...hints].slice(0, 4);
}

export function collectOutput(error: unknown): string {
  return [
    (error as { stdout?: string }).stdout ?? '',
    (error as { stderr?: string }).stderr ?? '',
    error instanceof Error ? error.message : String(error ?? ''),
  ]
    .join('\n')
    .trim();
}
