import { join, relative } from 'node:path';
import { runKebabGroupsCheck } from '@cfxdevkit/arch-check';
import { parseKebabGroupsArgs } from './args.js';
import {
  findWorkspaceRoot,
  getGitNexusSnapshot,
  writeDirectoryNodeJson,
  writeJson,
} from './context.js';
import { metadataRootRelativePath, type RepoCheckKebabGroupsResult } from './types.js';

export async function runStructuredKebabGroupsCheck(
  args: readonly string[],
): Promise<RepoCheckKebabGroupsResult> {
  const invocation = parseKebabGroupsArgs(args);
  const report = await runKebabGroupsCheck(invocation.options);
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const generatedAt = report.generatedAt;
  const requestedFrom = relative(workspaceRoot, process.cwd()).split('\\').join('/') || '.';
  const fileNodeRoot = join(metadataRootRelativePath, 'nodes', 'groups');

  const result: RepoCheckKebabGroupsResult = {
    kind: 'repo-structured',
    command: {
      namespace: 'repo',
      action: 'check',
      target: 'kebab-groups',
      script: 'check:kebab-groups',
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
      reportPath: join(metadataRootRelativePath, 'checks', 'kebab-groups.json'),
      workspaceNodePath: join(metadataRootRelativePath, 'nodes', 'workspace', 'kebab-groups.json'),
      fileNodeRoot,
      fileNodeCount: report.groups.length,
    },
    status: report.status,
    exitCode: report.status === 'error' ? 1 : 0,
    summary: {
      scannedFiles: report.totals.scannedFiles,
      groups: report.totals.groups,
      groupedFiles: report.totals.groupedFiles,
    },
    report: {
      policy: report.policy,
      groups: report.groups,
    },
  };

  await writeJson(workspaceRoot, result.artifacts.reportPath, result);
  await writeJson(workspaceRoot, result.artifacts.workspaceNodePath, {
    kind: 'workspace',
    generatedAt,
    check: 'kebab-groups',
    status: result.status,
    summary: result.summary,
    policy: result.report.policy,
    gitNexus: result.context.gitNexus,
  });

  await Promise.all(
    result.report.groups.map(async (group, index) => {
      await writeJson(workspaceRoot, join(fileNodeRoot, `group-${index + 1}.json`), {
        kind: 'kebab-group',
        generatedAt,
        check: 'kebab-groups',
        group,
        policy: result.report.policy,
      });
    }),
  );

  await Promise.all(
    result.report.groups.map(async (group) => {
      await writeDirectoryNodeJson(
        workspaceRoot,
        join(metadataRootRelativePath, 'nodes', 'directories'),
        group.directory,
        'kebab-groups.json',
        {
          kind: 'directory-kebab-groups',
          generatedAt: result.context.generatedAt,
          directory: group.directory,
          check: 'kebab-groups',
          summary: {
            groups: 1,
            groupedFiles: group.count,
          },
          policy: result.report.policy,
          groups: [group],
        },
      );
    }),
  );

  return result;
}
