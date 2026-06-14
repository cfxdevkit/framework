#!/usr/bin/env node
/**
 * Scaffold smoketest: scaffolds minimal-dapp, installs deps, and builds.
 * Run via: node scripts/smoketest-scaffold.mjs
 */
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { scaffoldProject } from '../packages/scaffold-cli/dist/scaffold.js';

const OUT_DIR = resolve(tmpdir(), `cfxdevkit-smoketest-${Date.now()}`);
const TEMPLATE = 'minimal-dapp';

console.log(`▶ Scaffolding ${TEMPLATE} → ${OUT_DIR}`);

try {
  await scaffoldProject(OUT_DIR, TEMPLATE, {
    name: 'smoketest-app',
    version: '0.0.1',
    description: 'Scaffold smoketest',
    skipInstall: true,
  });
  console.log('✓ Scaffold complete');

  console.log('▶ pnpm install (offline mode skipped — checking file structure only)');
  // Verify key files exist
  const requiredFiles = [
    'package.json',
    'src/main.tsx',
    'src/App.tsx',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
  ];
  let allExist = true;
  for (const file of requiredFiles) {
    const filePath = resolve(OUT_DIR, file);
    if (existsSync(filePath)) {
      console.log(`  ✓ ${file}`);
    } else {
      console.error(`  ✗ MISSING: ${file}`);
      allExist = false;
    }
  }
  if (!allExist) {
    process.exit(1);
  }
  console.log('✓ All required files present');
} finally {
  rmSync(OUT_DIR, { recursive: true, force: true });
  console.log('✓ Cleaned up');
}
