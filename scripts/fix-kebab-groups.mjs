#!/usr/bin/env node
/**
 * Resolve kebab-group violations by moving grouped files into subdirectories
 * and updating all import references across the repository.
 */
import { execSync } from 'node:child_process';
import { existsSync, globSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const reportPath = join(rootDir, 'artifacts', 'llm', 'reports', 'kebab-groups.json');

if (!existsSync(reportPath)) {
  console.error('No kebab-groups.json. Run: pnpm run check:kebab-groups');
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));

// Build move map: oldRelativePath → { dir, file }
// Process longest prefix first for nested groups
const sorted = [...report.groups].sort((a, b) => b.prefix.length - a.prefix.length);
const moveMap = new Map();

for (const group of sorted) {
  for (const file of group.files) {
    const oldPath = `${group.directory}/${file}`;
    if (moveMap.has(oldPath)) continue;
    const ext = extname(file);
    const stem = file.slice(0, -ext.length);
    const newStem = stem.slice(group.prefix.length + 1);
    moveMap.set(oldPath, `${group.directory}/${group.prefix}/${newStem}${ext}`);
  }
}

if (dryRun) console.log('🔍 DRY RUN\n');

// --- Step 1: Git move files ---
console.log(`Moving ${moveMap.size} files...\n`);
for (const [oldRel, newRel] of moveMap) {
  const oldAbs = join(rootDir, oldRel);
  const newAbs = join(rootDir, newRel);

  if (!existsSync(oldAbs)) {
    console.warn(`  ⚠ SKIP (missing): ${oldRel}`);
    continue;
  }

  if (dryRun) {
    console.log(`  ${oldRel} → ${newRel}`);
  } else {
    const newDir = dirname(newAbs);
    execSync(`mkdir -p "${newDir}"`, { stdio: 'pipe' });
    execSync(`git mv "${oldAbs}" "${newAbs}"`, { stdio: 'pipe' });
    console.log(`  ✅ ${oldRel} → ${newRel}`);
  }
}

if (dryRun) {
  console.log(`\nWould move ${moveMap.size} files. Use without --dry-run to execute.`);
  process.exit(0);
}

// --- Step 2: Build import path replacement map ---
// Key: old module specifier (repo-relative, no ext), Value: new module specifier
const replaceMap = new Map();
for (const [oldRel, newRel] of moveMap) {
  const oldNoExt = oldRel.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '');
  const newNoExt = newRel.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, '');
  if (oldNoExt !== newNoExt) {
    replaceMap.set(oldNoExt, newNoExt);
  }
}

// --- Step 3: Find all source files and fix imports ---
function* walkFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === 'node_modules' ||
      entry.name === '.git' ||
      entry.name === 'dist' ||
      entry.name === 'artifacts'
    )
      continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkFiles(full);
    else if (/\.(ts|tsx|js|jsx|json|md|mdx|yml|yaml|css)$/.test(entry.name)) yield full;
  }
}

console.log('\nUpdating import references...\n');
let updatedFiles = 0;
const totalReplaces = 0;

for (const absPath of walkFiles(rootDir)) {
  let content = readFileSync(absPath, 'utf8');
  let modified = false;

  for (const [oldSpec, newSpec] of replaceMap) {
    const escaped = oldSpec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match in import/require strings: "./path", "../path", "src/path"
    const re = new RegExp(`(['"\`])(\\.{0,2}\\/)?${escaped}(/index)?(['"\`])`, 'g');

    const newContent = content.replace(re, (_, q1, prefix, indexSuffix, q4) => {
      // Keep the same quote style
      return `${q1}${prefix || ''}${newSpec}${q4}`;
    });

    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  if (modified) {
    writeFileSync(absPath, content);
    updatedFiles++;
    const rel = relative(rootDir, absPath);
    console.log(`  📝 ${rel}`);
  }
}

console.log(`\n✅ Done: ${moveMap.size} files moved, ${updatedFiles} files with updated imports.`);
console.log('Run: pnpm run typecheck && pnpm run test   to verify.');
