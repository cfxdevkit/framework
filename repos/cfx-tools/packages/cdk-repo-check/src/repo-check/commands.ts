import { execFile } from 'node:child_process';
import { join, relative } from 'node:path';
import { promisify } from 'node:util';
import { parseRepoCommandArgs } from './args.js';
import {
  countLines,
  findWorkspaceRoot,
  getGitNexusSnapshot,
  tailLines,
  writeJson,
} from './context.js';
import {
  metadataRootRelativePath,
  type RepoCommandResult,
  type RepoCommandTarget,
  repoCommandDefinitions,
} from './types.js';

const execFileAsync = promisify(execFile);

export async function runStructuredRepoCommand(
  target: RepoCommandTarget,
  args: readonly string[],
): Promise<RepoCommandResult> {
  const definition = repoCommandDefinitions[target];
  if (!definition) {
    throw new Error(`Unsupported structured repo command target: ${target}`);
  }

  const { script, artifactGroup } = definition;
  const invocation = parseRepoCommandArgs(args);
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const generatedAt = new Date().toISOString();
  const requestedFrom = relative(workspaceRoot, process.cwd()).split('\\').join('/') || '.';
  const startedAt = Date.now();

  let stdout = '';
  let stderr = '';
  let exitCode = 0;

  try {
    const execution = await execFileAsync(
      'pnpm',
      [
        'run',
        script,
        ...(invocation.forwardedArgs.length > 0 ? ['--', ...invocation.forwardedArgs] : []),
      ],
      {
        cwd: workspaceRoot,
        maxBuffer: 1024 * 1024 * 20,
      },
    );
    stdout = execution.stdout;
    stderr = execution.stderr;
  } catch (error) {
    const executionError = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
      code?: number | string;
    };
    stdout = executionError.stdout ?? '';
    stderr = executionError.stderr ?? '';
    exitCode = typeof executionError.code === 'number' ? executionError.code : 1;
  }

  const result: RepoCommandResult = {
    kind: 'repo-structured',
    command: {
      namespace: 'repo',
      action: 'command',
      target,
      script,
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
      reportPath: join(metadataRootRelativePath, artifactGroup, `${target}.json`),
      workspaceNodePath: join(
        metadataRootRelativePath,
        'nodes',
        'workspace',
        artifactGroup,
        `${target}.json`,
      ),
    },
    status: exitCode === 0 ? 'ok' : 'error',
    exitCode,
    summary: {
      durationMs: Date.now() - startedAt,
      stdoutLineCount: countLines(stdout),
      stderrLineCount: countLines(stderr),
    },
    result: {
      stdoutTail: tailLines(stdout),
      stderrTail: tailLines(stderr),
    },
  };

  await writeJson(workspaceRoot, result.artifacts.reportPath, result);
  await writeJson(workspaceRoot, result.artifacts.workspaceNodePath, {
    kind: 'workspace-command',
    generatedAt,
    target,
    script,
    artifactGroup,
    status: result.status,
    exitCode: result.exitCode,
    summary: result.summary,
    gitNexus: result.context.gitNexus,
  });

  return result;
}
