import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

import { findRepoRoot } from '../workspace.js';

const execFileAsync = promisify(execFile);

type WorkspacePnpmOptions = {
  repoRoot?: string;
  maxBuffer?: number;
};

export async function runWorkspacePnpm(
  args: readonly string[],
  options: WorkspacePnpmOptions = {},
): Promise<void> {
  const repoRoot = options.repoRoot ?? findRepoRoot();
  await new Promise<void>((resolve, reject) => {
    const child = spawn('pnpm', [...args], {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', reject);
    child.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
      if (signal) {
        reject(new Error(`pnpm ${args.join(' ')} terminated with signal ${signal}`));
        return;
      }
      if ((code ?? 1) !== 0) {
        reject(new Error(`pnpm ${args.join(' ')} exited with code ${code ?? 1}`));
        return;
      }
      resolve();
    });
  });
}

export async function captureWorkspacePnpm(
  args: readonly string[],
  options: WorkspacePnpmOptions = {},
): Promise<string> {
  const repoRoot = options.repoRoot ?? findRepoRoot();
  const maxBuffer = options.maxBuffer ?? 20 * 1024 * 1024;
  try {
    const { stdout, stderr } = await execFileAsync('pnpm', [...args], {
      cwd: repoRoot,
      env: process.env,
      maxBuffer,
    });
    return [stdout, stderr].filter(Boolean).join('\n').trim();
  } catch (error) {
    if (error && typeof error === 'object' && 'stdout' in error && 'stderr' in error) {
      const stdout = String((error as { stdout?: string }).stdout ?? '');
      const stderr = String((error as { stderr?: string }).stderr ?? '');
      throw new Error([stdout, stderr].filter(Boolean).join('\n').trim() || String(error));
    }
    throw error;
  }
}
