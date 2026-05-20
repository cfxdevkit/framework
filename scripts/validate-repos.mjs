#!/usr/bin/env node
/**
 * Runs validate-workspace.mjs and check-deps.mjs for every cfx-* repo
 * sequentially.  Collects all failures before exiting so you see the
 * full picture in one pass.
 *
 * Usage (from workspace root): node scripts/validate-repos.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

const REPOS = [
  'cfx-config',
  'cfx-core',
  'cfx-domain',
  'cfx-keys',
  'cfx-llm',
  'cfx-meta',
  'cfx-solidity',
  'cfx-tools',
  'cfx-ui',
];

const SCRIPTS = ['validate-workspace.mjs', 'check-deps.mjs'];

const failures = [];

for (const repo of REPOS) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${repo}`);
  console.log(`${'─'.repeat(50)}`);

  for (const scriptName of SCRIPTS) {
    const scriptPath = join(root, 'repos', repo, 'scripts', scriptName);

    if (!existsSync(scriptPath)) {
      console.log(`  SKIP  ${scriptName}  (not found)`);
      continue;
    }

    const result = spawnSync('node', [scriptPath], {
      stdio: 'inherit',
      cwd: root,
      env: { ...process.env, NO_COLOR: '1' },
    });

    if (result.status !== 0) {
      failures.push(`${repo}/${scriptName}`);
    }
  }
}

console.log(`\n${'═'.repeat(50)}`);
if (failures.length > 0) {
  console.error(`Repo validation FAILED (${failures.length} failure(s)):`);
  for (const f of failures) console.error(`  ✗  ${f}`);
  process.exit(1);
} else {
  console.log(`All repo validations PASSED (${REPOS.length} repos)`);
}
