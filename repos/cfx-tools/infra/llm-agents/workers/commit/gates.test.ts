import { describe, expect, it } from 'vitest';
import { buildDeterministicHints, extractSignalLines } from './gate-output.ts';
import { formatOperationHud, summarizeWorkingSet } from './hud.ts';

describe('commit gate signal extraction', () => {
  it('filters boilerplate and keeps the first diagnostics', () => {
    expect(
      extractSignalLines(
        [
          '> root@ lint /workspaces/root',
          'Tasks: 1 completed',
          'src/index.ts:54:1 assist/source/organizeImports FIXABLE',
          'Sort the exported names.',
        ].join('\n'),
      ),
    ).toEqual([
      'src/index.ts:54:1 assist/source/organizeImports FIXABLE',
      'Sort the exported names.',
    ]);
  });

  it('drops moon notices, cache chatter, and artifact footers from signal output', () => {
    expect(
      extractSignalLines(
        [
          "\u001b[38;5;208m▮\u001b[0m\u001b[38;5;214m▮\u001b[0m\u001b[38;5;220m▮\u001b[0m\u001b[38;5;226m▮\u001b[0m There's a new version of moon available, 2.2.5 (currently on 2.2.4)!",
          'Learn more: https://moonrepo.dev/blog/moon-v2.2',
          'Install with: https://moonrepo.dev/docs/install',
          '▮▮▮▮ executor:test (cached, 403078e2)',
          'Code hotspots: error',
          'Hard violations:',
          '- repos/cfx-tools/infra/tooling-cli/src/agent-config.ts: 370 lines',
          'Reports: artifacts/llm/reports/code-hotspots.{md,json}',
        ].join('\n'),
      ),
    ).toEqual([
      'Code hotspots: error',
      'Hard violations:',
      '- repos/cfx-tools/infra/tooling-cli/src/agent-config.ts: 370 lines',
    ]);
  });
});

describe('commit gate hints', () => {
  it('adds lint-specific guidance plus a reproduce command', () => {
    expect(
      buildDeterministicHints({
        id: 'lint',
        command: 'pnpm run lint',
        output: 'assist/source/organizeImports\nFIXABLE',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('import/export reordering'),
        expect.stringContaining('Reproduce with: pnpm run lint'),
      ]),
    );
  });

  it('prefers supported repo CLI commands in repository-policy reproduce hints', () => {
    expect(
      buildDeterministicHints({
        id: 'hotspots',
        command: 'pnpm cdk repo check hotspots -- --fail-on-hard',
        output: 'Code hotspots: error',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('hotspot hard limit'),
        'Reproduce with: pnpm cdk repo check hotspots -- --fail-on-hard',
      ]),
    );
    expect(
      buildDeterministicHints({
        id: 'kebab-groups',
        command: 'pnpm cdk repo check kebab-groups',
        output: 'Kebab filename groups: warning',
      }),
    ).toContain('Reproduce with: pnpm cdk repo check kebab-groups');
  });

  it('keeps hotspot and kebab findings in the extracted signal lines', () => {
    expect(
      extractSignalLines(
        [
          'Code hotspots: error',
          'Scanned 243 source files; 5 hard violation(s), 0 soft warning(s).',
          '',
          'Hard violations:',
          '- repos/cfx-tools/infra/tooling-cli/src/agent-config.ts: 370 lines',
          '- repos/cfx-tools/infra/llm-agents/workers/commit/index.ts: 535 lines',
        ].join('\n'),
      ),
    ).toEqual(
      expect.arrayContaining([
        'Hard violations:',
        '- repos/cfx-tools/infra/tooling-cli/src/agent-config.ts: 370 lines',
        '- repos/cfx-tools/infra/llm-agents/workers/commit/index.ts: 535 lines',
      ]),
    );

    expect(
      extractSignalLines(
        [
          'Kebab filename groups: warning',
          'Scanned 243 source files; found 30 grouped kebab-case prefix(es) covering 75 file(s).',
          '',
          'Grouped siblings:',
          '- repos/cfx-tools/infra/tooling-cli/src: agent*.ts -> agent-config.ts, agent-help.ts',
        ].join('\n'),
      ),
    ).toEqual(
      expect.arrayContaining([
        'Grouped siblings:',
        '- repos/cfx-tools/infra/tooling-cli/src: agent*.ts -> agent-config.ts, agent-help.ts',
      ]),
    );
  });
});

describe('commit HUD', () => {
  it('renders unit, llm, and working-set details', () => {
    const lines = formatOperationHud({
      title: 'Repo Precommit HUD',
      executionContext: {
        unit: { name: 'docs', rootDir: 'docs', configPath: 'artifacts/llm/config/units/docs.json' },
        llm: {
          used: true,
          status: 'ready',
          configPath: 'artifacts/llm/config/units/docs.json',
          provider: 'litellm',
          model: 'qwen3',
          baseUrl: 'http://127.0.0.1:4000/v1',
        },
      },
      workingSet: summarizeWorkingSet([
        { label: 'docs', files: ['docs/README.md'] },
        { label: 'repos/cfx-tools', files: ['repos/cfx-tools/infra/tooling-cli/src/run.ts'] },
      ]),
      llmFailureAnalysis: true,
    });

    expect(lines.join('\n')).toContain('Unit: docs (docs)');
    expect(lines.join('\n')).toContain('Failure analysis: enabled on failing gates');
    expect(lines.join('\n')).toContain('Working set: 2 file(s) across 2 scope(s)');
  });
});
