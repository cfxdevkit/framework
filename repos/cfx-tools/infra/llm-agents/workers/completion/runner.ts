import { execFileAsync, root } from '../shared/index.ts';

export async function commandBlock(
  title,
  command,
  args,
  opts: { timeoutMs?: number; maxChars?: number } = {},
) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: root,
      maxBuffer: 1024 * 1024 * 10,
      signal: AbortSignal.timeout(opts.timeoutMs ?? 30000),
      env: { ...process.env, NO_COLOR: '1', MOON_COLOR: 'false' },
    });
    return renderCommandBlock(title, 0, stdout, stderr, opts.maxChars);
  } catch (error) {
    return renderCommandBlock(
      title,
      error?.code ?? 1,
      error?.stdout ?? '',
      error?.stderr ?? error?.message ?? '',
      opts.maxChars,
    );
  }
}

export function renderCommandBlock(title, exitCode, stdout, stderr, maxChars = 8000) {
  const output = [stdout, stderr].filter(Boolean).join('\n').trim();
  const truncated =
    output.length > maxChars ? `${output.slice(0, maxChars)}\n...[truncated]` : output;
  return [`## ${title}`, `exitCode: ${exitCode}`, truncated || '(no output)'].join('\n');
}

export async function git(args): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd: root, maxBuffer: 1024 * 1024 * 10 });
  return stdout.trim();
}
