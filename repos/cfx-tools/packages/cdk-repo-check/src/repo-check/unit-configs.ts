import { join, relative } from 'node:path';
import { runUnitConfigsCheck } from '@cfxdevkit/arch-check';
import { parseUnitConfigsArgs } from './args.js';
import {
  findWorkspaceRoot,
  getGitNexusSnapshot,
  normalizeRelativePath,
  writeDirectoryNodeJson,
  writeJson,
} from './context.js';
import {
  metadataRootRelativePath,
  type RepoCheckUnitConfigsResult,
  type UnitConfigRecord,
} from './types.js';

export async function runStructuredUnitConfigsCheck(
  args: readonly string[],
): Promise<RepoCheckUnitConfigsResult> {
  const invocation = parseUnitConfigsArgs(args);
  const report = await runUnitConfigsCheck(invocation.options);
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const generatedAt = report.generatedAt;
  const requestedFrom = relative(workspaceRoot, process.cwd()).split('\\').join('/') || '.';
  const fileNodeRoot = join(metadataRootRelativePath, 'nodes', 'units');

  const result: RepoCheckUnitConfigsResult = {
    kind: 'repo-structured',
    command: {
      namespace: 'repo',
      action: 'check',
      target: 'unit-configs',
      script: 'check:unit-configs',
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
      reportPath: join(metadataRootRelativePath, 'checks', 'unit-configs.json'),
      workspaceNodePath: join(metadataRootRelativePath, 'nodes', 'workspace', 'unit-configs.json'),
      fileNodeRoot,
      fileNodeCount: report.units.length,
    },
    status: report.status,
    exitCode: invocation.options.failOnDrift && report.status === 'error' ? 1 : 0,
    summary: {
      units: report.totals.units,
      configured: report.totals.configured,
      missing: report.totals.missing,
      drifted: report.totals.drifted,
      written: report.totals.written,
    },
    report: {
      policy: report.policy,
      units: report.units,
    },
  };

  await writeJson(workspaceRoot, result.artifacts.reportPath, result);
  await writeJson(workspaceRoot, result.artifacts.workspaceNodePath, {
    kind: 'workspace',
    generatedAt,
    check: 'unit-configs',
    status: result.status,
    summary: result.summary,
    policy: result.report.policy,
    gitNexus: result.context.gitNexus,
  });

  await Promise.all(
    result.report.units.map(async (unit) => {
      await writeJson(workspaceRoot, join(fileNodeRoot, `${unit.unit}.json`), {
        kind: 'unit-config',
        generatedAt,
        check: 'unit-configs',
        unit,
        policy: result.report.policy,
      });
    }),
  );

  await writeUnitConfigDirectoryMetadata(workspaceRoot, result);

  return result;
}

async function writeUnitConfigDirectoryMetadata(
  workspaceRoot: string,
  result: RepoCheckUnitConfigsResult,
): Promise<void> {
  const directoryNodeRoot = join(metadataRootRelativePath, 'nodes', 'directories');
  const directories = new Map<
    string,
    {
      rootDir: string;
      units: UnitConfigRecord[];
    }
  >();

  for (const unit of result.report.units) {
    const rootDir = normalizeRelativePath(unit.rootDir);
    const current = directories.get(rootDir);
    if (!current) {
      directories.set(rootDir, { rootDir, units: [unit] });
      continue;
    }
    current.units.push(unit);
  }

  await Promise.all(
    [...directories.values()].map(async (directoryRecord) => {
      const summary = {
        units: directoryRecord.units.length,
        configured: directoryRecord.units.filter((unit) => unit.status === 'ok').length,
        missing: directoryRecord.units.filter((unit) => unit.status === 'missing').length,
        drifted: directoryRecord.units.filter((unit) => unit.status === 'drift').length,
      };

      await writeDirectoryNodeJson(
        workspaceRoot,
        directoryNodeRoot,
        directoryRecord.rootDir,
        'unit-configs.json',
        {
          kind: 'directory-unit-configs',
          generatedAt: result.context.generatedAt,
          directory: directoryRecord.rootDir,
          check: 'unit-configs',
          summary,
          policy: result.report.policy,
          units: directoryRecord.units,
        },
      );
    }),
  );
}
