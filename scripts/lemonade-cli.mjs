#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const worker = join(repoRoot, 'repos/cfx-tools/packages/llm-tools/workers/lemonade-cli.mjs');
const child = spawn(process.execPath, [worker, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
