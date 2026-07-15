export function extractSignalLines(output: string, maxLines = 8): string[] {
  const filtered = output
    .split('\n')
    .map(normalizeOutputLine)
    .filter(Boolean)
    .filter((line) => !isNoiseLine(line));
  return filtered.slice(0, maxLines);
}

function normalizeOutputLine(line: string): string {
  return stripAnsi(line)
    .replace(/^[▮\s]+/, '')
    .trim();
}

function stripAnsi(line: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape stripping needs the ESC byte matcher.
  return line.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '');
}

function isNoiseLine(line: string): boolean {
  // Strip ANSI escape codes before checking — raw command output may have
  // ANSI sequences prepended, so noise patterns (like `▮` or `>`) would not
  // match against the raw string.  Check the normalized line instead.
  const normalized = stripAnsi(line);
  return (
    normalized.startsWith('> ') ||
    /^Done in \d/.test(normalized) ||
    // Moon progress bars and task prefixes (shouldn't appear with --quiet, safety net)
    /^▮/.test(normalized) ||
    /^\S+:\S+\s+\|/.test(normalized) ||
    // Moon version notices (shouldn't appear with --quiet, safety net)
    /^There's a new version of moon available\b/i.test(normalized) ||
    /^Learn more: https:\/\/moonrepo\.dev\//i.test(normalized) ||
    /^Install with: https:\/\/moonrepo\.dev\/docs\/install/i.test(normalized) ||
    // Cached/no-op summaries (shouldn't appear with --quiet, safety net)
    /^\S+:\S+\s+\((cached|no op),/i.test(normalized) ||
    // Moon summary footer (shouldn't appear with --quiet, safety net)
    /^Tasks:\s+\d+\s+completed/.test(normalized) ||
    /^Time:\s/.test(normalized) ||
    /^Reports?: artifacts\//i.test(normalized)
  );
}

export function buildDeterministicHints(result: {
  id: string;
  command: string;
  output: string;
}): string[] {
  const hints = new Set<string>();
  if (result.id === 'gitnexus-analyze') {
    hints.add(
      'GitNexus analysis failed; ensure the index bootstrap succeeds, then rerun the validation sequence.',
    );
  }
  if (result.id === 'format') {
    hints.add(
      'Formatter or write step failed; resolve the first file-system or parser error, then rerun.',
    );
  }
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
  if (result.id === 'check') {
    hints.add(
      'The root repo check failed; fix the first failing workspace task it reports before rerunning the full sequence.',
    );
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
