import { spawn, type ChildProcess } from 'node:child_process';

interface RunnerProcess {
  label: string;
  proc: ChildProcess;
}

const children: RunnerProcess[] = [];

function prefix(label: string, line: string): string {
  return `[${label}] ${line}`;
}

function spawnService(label: string, command: string, args: string[], cwd: string): ChildProcess {
  const proc = spawn(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  proc.stdout?.on('data', (chunk: Buffer) => {
    for (const line of chunk.toString().split('\n')) {
      if (line.trim()) console.log(prefix(label, line));
    }
  });

  proc.stderr?.on('data', (chunk: Buffer) => {
    for (const line of chunk.toString().split('\n')) {
      if (line.trim()) console.error(prefix(label, line));
    }
  });

  proc.on('exit', (code) => {
    console.log(prefix(label, `Process exited with code ${code ?? 'unknown'}`));
  });

  return proc;
}

export function startProcesses(cwd: string): void {
  const backend = spawnService('backend', 'pnpm', ['--filter', '@cfxdevkit/cas-backend', 'start'], cwd);
  const frontend = spawnService('frontend', 'pnpm', ['--filter', '@cfxdevkit/cas-frontend', 'start'], cwd);

  children.push({ label: 'backend', proc: backend });
  children.push({ label: 'frontend', proc: frontend });

  // SIGINT handler: forward SIGTERM to children, then exit
  process.on('SIGINT', () => {
    console.log('\nShutting down…');
    for (const { label, proc } of children) {
      console.log(`  Sending SIGTERM to ${label}…`);
      proc.kill('SIGTERM');
    }

    // Wait briefly for graceful shutdown, then force exit
    let pending = children.length;
    if (pending === 0) {
      process.exit(0);
      return;
    }
    for (const { proc } of children) {
      proc.on('exit', () => {
        pending--;
        if (pending === 0) process.exit(0);
      });
    }
    // Force exit after 5 s
    setTimeout(() => { process.exit(1); }, 5000).unref();
  });
}
