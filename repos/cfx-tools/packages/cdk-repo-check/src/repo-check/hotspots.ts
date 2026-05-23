import { dirname, join, relative } from 'node:path';
import { runHotspotsCheck } from '@cfxdevkit/arch-check';
import { parseHotspotsArgs } from './args.js';
import {
  findWorkspaceRoot,
  getGitNexusSnapshot,
  normalizeRelativePath,
  writeDirectoryNodeJson,
  writeJson,
} from './context.js';
import {
  type HotspotRecord,
  metadataRootRelativePath,
  type RepoCheckHotspotsResult,
} from './types.js';

export async function runStructuredHotspotsCheck(
  args: readonly string[],
): Promise<RepoCheckHotspotsResult> {
  const invocation = parseHotspotsArgs(args);
  const report = await runHotspotsCheck(invocation.options);
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const generatedAt = report.generatedAt;
  const requestedFrom = relative(workspaceRoot, process.cwd()).split('\\').join('/') || '.';
  const fileNodeRoot = join(metadataRootRelativePath, 'nodes', 'files');

  const result: RepoCheckHotspotsResult = {
    kind: 'repo-structured',
    command: {
      namespace: 'repo',
      action: 'check',
      target: 'hotspots',
      script: 'check:hotspots',
      args: invocation.forwardedArgs,
      outputMode: invocation.outputMode,
    },
    context: {
      workspaceRoot: '.',
      requestedFrom,
      metadataRoot: metadataRootRelativePath,
      generatedAt,
      gitNexus: await getGitNexusSnapshot(workspaceRoot),
    },
    artifacts: {
      reportPath: join(metadataRootRelativePath, 'checks', 'hotspots.json'),
      workspaceNodePath: join(metadataRootRelativePath, 'nodes', 'workspace', 'hotspots.json'),
      fileNodeRoot,
      fileNodeCount: 0,
    },
    status: report.status,
    exitCode: invocation.options.failOnHard && report.hardViolations.length > 0 ? 1 : 0,
    summary: {
      scannedFiles: report.totals.scannedFiles,
      hardViolations: report.totals.hardViolations,
      softWarnings: report.totals.softWarnings,
    },
    report: {
      policy: report.policy,
      hotspots: report.hotspots,
      hardViolations: report.hardViolations,
      softWarnings: report.softWarnings,
    },
  };

  result.artifacts.fileNodeCount = await writeHotspotMetadata(workspaceRoot, result);
  return result;
}

async function writeHotspotMetadata(
  workspaceRoot: string,
  result: RepoCheckHotspotsResult,
): Promise<number> {
  await writeJson(workspaceRoot, result.artifacts.reportPath, result);
  await writeJson(workspaceRoot, result.artifacts.workspaceNodePath, {
    kind: 'workspace',
    generatedAt: result.context.generatedAt,
    check: 'hotspots',
    status: result.status,
    summary: result.summary,
    policy: result.report.policy,
    gitNexus: result.context.gitNexus,
  });

  const nodes = collectNodeRecords(
    result.report.hotspots,
    result.report.hardViolations,
    result.report.softWarnings,
  );
  await Promise.all(
    [...nodes.values()].map(async (record) => {
      await writeJson(
        workspaceRoot,
        join(
          result.artifacts.fileNodeRoot ?? join(metadataRootRelativePath, 'nodes', 'files'),
          `${record.path}.hotspots.json`,
        ),
        {
          kind: 'source-file',
          path: record.path,
          generatedAt: result.context.generatedAt,
          check: 'hotspots',
          status: record.overHardLimit ? 'error' : record.overSoftLimit ? 'warning' : 'ok',
          policy: result.report.policy,
          hotspot: record,
        },
      );
    }),
  );

  await writeHotspotDirectoryMetadata(workspaceRoot, result, [...nodes.values()]);

  return nodes.size;
}

async function writeHotspotDirectoryMetadata(
  workspaceRoot: string,
  result: RepoCheckHotspotsResult,
  records: readonly HotspotRecord[],
): Promise<void> {
  const directoryNodeRoot = join(metadataRootRelativePath, 'nodes', 'directories');
  const directories = new Map<
    string,
    {
      directory: string;
      files: number;
      hardViolations: number;
      softWarnings: number;
      topHotspot: HotspotRecord;
    }
  >();

  for (const record of records) {
    const directory = normalizeRelativePath(dirname(record.path));
    const current = directories.get(directory);
    if (!current) {
      directories.set(directory, {
        directory,
        files: 1,
        hardViolations: record.overHardLimit ? 1 : 0,
        softWarnings: record.overSoftLimit ? 1 : 0,
        topHotspot: record,
      });
      continue;
    }

    current.files += 1;
    current.hardViolations += record.overHardLimit ? 1 : 0;
    current.softWarnings += record.overSoftLimit ? 1 : 0;
    if (record.hotspotScore > current.topHotspot.hotspotScore) {
      current.topHotspot = record;
    }
  }

  await Promise.all(
    [...directories.values()].map(async (directoryRecord) => {
      await writeDirectoryNodeJson(
        workspaceRoot,
        directoryNodeRoot,
        directoryRecord.directory,
        'hotspots.json',
        {
          kind: 'directory-hotspots',
          generatedAt: result.context.generatedAt,
          directory: directoryRecord.directory,
          check: 'hotspots',
          status:
            directoryRecord.hardViolations > 0
              ? 'error'
              : directoryRecord.softWarnings > 0
                ? 'warning'
                : 'ok',
          summary: {
            files: directoryRecord.files,
            hardViolations: directoryRecord.hardViolations,
            softWarnings: directoryRecord.softWarnings,
          },
          policy: result.report.policy,
          topHotspot: directoryRecord.topHotspot,
        },
      );
    }),
  );
}

function collectNodeRecords(...groups: readonly HotspotRecord[][]): Map<string, HotspotRecord> {
  const nodes = new Map<string, HotspotRecord>();
  for (const group of groups) {
    for (const record of group) {
      nodes.set(record.path, record);
    }
  }
  return nodes;
}
