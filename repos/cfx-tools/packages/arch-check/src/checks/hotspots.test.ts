import { describe, expect, it } from 'vitest';
import { type HotspotReport, renderConsoleReport } from './hotspots.js';

describe('hotspot console report', () => {
  it('keeps console output focused on findings', () => {
    const report: HotspotReport = {
      generatedAt: '2026-05-22T00:00:00.000Z',
      status: 'error',
      policy: {
        source: 'docs/architecture/framework-design-principles.md',
        softFileLineLimit: 250,
        hardFileLineLimit: 300,
        churnWindow: '90 days ago',
      },
      totals: {
        scannedFiles: 243,
        softWarnings: 1,
        hardViolations: 1,
      },
      hardViolations: [
        {
          path: 'repos/cfx-tools/infra/tooling-cli/src/agent-config.ts',
          lines: 370,
          added: 40,
          deleted: 20,
          addedLines: 40,
          deletedLines: 20,
          commits: 3,
          hotspotScore: 565,
          overSoftLimit: true,
          overHardLimit: true,
        },
      ],
      softWarnings: [],
      hotspots: [
        {
          path: 'repos/cfx-tools/infra/tooling-cli/src/agent-config.ts',
          lines: 370,
          added: 40,
          deleted: 20,
          addedLines: 40,
          deletedLines: 20,
          commits: 3,
          hotspotScore: 565,
          overSoftLimit: true,
          overHardLimit: true,
        },
      ],
    };

    const output = renderConsoleReport(report);

    expect(output).toContain('Hard violations:');
    expect(output).toContain('- repos/cfx-tools/infra/tooling-cli/src/agent-config.ts: 370 lines');
    expect(output).toContain('score 565');
    expect(output).not.toContain('+40/-20');
    expect(output).not.toContain('Reports: artifacts/llm/reports/code-hotspots.{md,json}');
  });
});
