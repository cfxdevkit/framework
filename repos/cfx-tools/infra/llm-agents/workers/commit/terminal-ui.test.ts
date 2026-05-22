import { describe, expect, it } from 'vitest';
import { summarizeFailureAnalysis, summarizeGateFailures } from './terminal-ui-summary.ts';
import { createWorkflowTerminalUi } from './terminal-ui.ts';

describe('commit terminal ui', () => {
  it('summarizes failing gates with a repro command', () => {
    expect(
      summarizeGateFailures({
        kind: 'quality',
        label: 'Quality gates',
        passed: false,
        skipped: false,
        results: [
          {
            kind: 'quality',
            id: 'lint',
            label: 'Lint',
            command: 'pnpm lint',
            required: true,
            status: 'error',
            elapsedMs: 1200,
            summary: 'Checked 18 files in 31ms. Found 2 errors.',
            output: 'lint output',
            signalLines: ['src/index.ts:1:1 organize imports'],
            hints: ['Reproduce with: pnpm lint'],
          },
        ],
      }),
    ).toEqual([
      'blocked: Lint - Checked 18 files in 31ms. Found 2 errors.',
      'detail: src/index.ts:1:1 organize imports',
      'next: pnpm lint',
    ]);
  });

  it('drops duplicate detail lines when the summary already uses the first signal line', () => {
    expect(
      summarizeGateFailures({
        kind: 'quality',
        label: 'Quality gates',
        passed: false,
        skipped: false,
        results: [
          {
            kind: 'quality',
            id: 'lint',
            label: 'Lint',
            command: 'pnpm run lint',
            required: true,
            status: 'error',
            elapsedMs: 1200,
            summary: 'mcp-server:lint | Checked 29 files in 63ms. No fixes applied.',
            output: 'lint output',
            signalLines: [
              'mcp-server:lint | Checked 29 files in 63ms. No fixes applied.',
              'repos/cfx-tools/infra/mcp-server/src/index.ts:12:1 assist/source/organizeImports FIXABLE',
            ],
            hints: ['Reproduce with: pnpm run lint'],
          },
        ],
      }),
    ).toEqual([
      'blocked: Lint - mcp-server:lint | Checked 29 files in 63ms. No fixes applied.',
      'detail: repos/cfx-tools/infra/mcp-server/src/index.ts:12:1 assist/source/organizeImports FIXABLE',
      'next: pnpm run lint',
    ]);
  });

  it('compresses structured failure analysis into actionable lines', () => {
    expect(
      summarizeFailureAnalysis({
        attempted: true,
        usedLlm: true,
        status: 'ready',
        content: [
          'Summary',
          '- Lint is failing because imports are out of order.',
          'Root causes',
          '- A recent export moved between files without reformatting.',
          'Minimal fixes',
          '- Run pnpm lint:fix.',
          '- Re-run pnpm lint.',
          'Next commands',
          '- pnpm lint:fix',
          '- pnpm lint',
        ].join('\n'),
      }),
    ).toEqual([
      'summary: Lint is failing because imports are out of order.',
      'cause: A recent export moved between files without reformatting.',
      'fix: Run pnpm lint:fix.',
      'fix: Re-run pnpm lint.',
      'next: pnpm lint:fix',
      'next: pnpm lint',
    ]);
  });

  it('prints compact non-interactive status lines instead of box output', () => {
    let output = '';
    const ui = createWorkflowTerminalUi({
      commandLabel: 'repo commit',
      executionContext: {
        unit: null,
        llm: {
          used: true,
          status: 'ready',
          configPath: '.pi/providers.json',
          provider: 'litellm',
          model: 'demo-model',
          baseUrl: 'http://127.0.0.1:4000/v1',
        },
      },
      workingSet: {
        fileCount: 4,
        scopeCount: 2,
        scopeLabels: ['delivery', 'implementation'],
        sampleFiles: ['docs/README.md'],
      },
      llmFailureAnalysis: true,
      stdout: {
        isTTY: false,
        write(chunk: string) {
          output += chunk;
          return true;
        },
      } as NodeJS.WriteStream,
      interactive: false,
    });

    ui.start();
    ui.startStep(1, 8, 'Repository policy and quality gates');
    ui.gateHooks.onGroupStart?.({
      kind: 'quality',
      label: 'Quality gates',
      gates: [{ id: 'lint', label: 'Lint', required: true }],
    });
    ui.gateHooks.onGateStart?.({ kind: 'quality', id: 'lint', label: 'Lint', required: true });
    ui.gateHooks.onGateFinish?.({
      kind: 'quality',
      id: 'lint',
      label: 'Lint',
      command: 'pnpm lint',
      required: true,
      status: 'ok',
      elapsedMs: 900,
      summary: 'Checked 18 files in 31ms.',
      output: 'ok',
      signalLines: [],
      hints: [],
    });
    ui.finish('passed', ['all checks passed']);

    expect(output).toContain('repo commit · shared · litellm/demo-model · 4 files / 2 scopes');
    expect(output).toContain('step 1/8 · Repository policy and quality gates');
    expect(output).toContain('ok    Lint');
    expect(output).toContain('status: passed');
    expect(output).not.toContain('+---');
  });
});