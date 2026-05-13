import { join } from 'node:path';
import { execFileAsync, QUALITY_GATES, root } from '../shared/index.ts';
import { logInfo } from '../shared/logging.ts';

export async function runCodeHotspotGate() {
  process.stdout.write('  › Code hotspots...');
  const start = Date.now();
  try {
    const { stdout, stderr } = await execFileAsync(
      'pnpm',
      [
        'exec',
        'tsx',
        join(root, 'repos/cfx-tools/packages/arch-check/src/bin/check-hotspots.ts'),
        '--fail-on-hard',
      ],
      {
        cwd: root,
        maxBuffer: 1024 * 1024 * 10,
        signal: AbortSignal.timeout(120000),
        env: { ...process.env, NO_COLOR: '1', MOON_COLOR: 'false', FORCE_COLOR: '0' },
      },
    );
    const summary = extractHotspotSummary(stdout + stderr);
    console.log(` ✓  (${((Date.now() - start) / 1000).toFixed(1)}s)${summary}`);
    return true;
  } catch (error) {
    console.log(` ✗  (${((Date.now() - start) / 1000).toFixed(1)}s)`);
    const output = [error?.stdout ?? '', error?.stderr ?? error?.message ?? ''].join('\n').trim();
    for (const line of output.split('\n').slice(0, 24)) logInfo(`     ${line}`);
    if (output.split('\n').length > 24) logInfo('     ...[truncated]');
    return false;
  }
}

export async function runQualityGates(flags) {
  if (flags.skipChecks) {
    logInfo('  --skip-checks: skipping all quality gates');
    return true;
  }

  const gates = QUALITY_GATES.filter((g) => {
    if (g.id === 'test') return flags.withTests;
    if (g.id === 'build') return flags.withBuild;
    return true; // lint + typecheck always run
  });

  let allPassed = true;
  for (const gate of gates) {
    process.stdout.write(`  › ${gate.label}...`);
    const start = Date.now();
    try {
      const { stdout, stderr } = await execFileAsync(gate.cmd, gate.args, {
        cwd: root,
        maxBuffer: 1024 * 1024 * 10,
        signal: AbortSignal.timeout(gate.timeoutMs),
        env: { ...process.env, NO_COLOR: '1', MOON_COLOR: 'false', FORCE_COLOR: '0' },
      });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const summary = extractGateSummary(stdout + stderr);
      console.log(` ✓  (${elapsed}s)${summary ? `  ${summary}` : ''}`);
    } catch (error) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(` ✗  (${elapsed}s)`);
      const output = [error?.stdout ?? '', error?.stderr ?? error?.message ?? ''].join('\n').trim();
      // Print first 20 lines of error output indented
      const lines = output.split('\n').slice(0, 20);
      for (const line of lines) {
        logInfo(`     ${line}`);
      }
      if (output.split('\n').length > 20) logInfo('     ...[truncated]');
      if (gate.required) allPassed = false;
      else logInfo(`     (non-required gate, continuing)`);
    }
  }
  return allPassed;
}

export function extractGateSummary(output) {
  // Moon task summary line: "Tasks: N completed (N cached)"
  const moonMatch = output.match(/Tasks:\s+\d+\s+completed[^\n]*/);
  if (moonMatch) return moonMatch[0].trim();
  // Biome summary: "Checked N files"
  const biomeMatch = output.match(/Checked \d+ files[^\n]*/);
  if (biomeMatch) return biomeMatch[0].trim();
  return '';
}

export function extractHotspotSummary(output) {
  const match = output.match(/Scanned \d+ source files;[^\n]*/);
  return match ? `  ${match[0].trim()}` : '';
}

// ─── Scope detection ──────────────────────────────────────────────────────────
