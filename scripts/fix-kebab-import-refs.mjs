#!/usr/bin/env node
/**
 * Comprehensive import fixer for kebab-group file moves (v4).
 * Handles:
 *  1. Files importing moved files (update to new paths)
 *  2. Moved files with imports that now need ../ adjustment (depth shift)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

const reportPath = join(rootDir, 'artifacts', 'llm', 'reports', 'kebab-groups.json');
if (!existsSync(reportPath)) {
  console.error('No kebab-groups.json found. Run: pnpm run check:kebab-groups');
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const sorted = [...report.groups].sort((a, b) => b.prefix.length - a.prefix.length);

// Build moveMap: oldAbs (w/ and w/o ext) → newAbs (w/o ext)
const moveMap = new Map();
// Also build: oldAbs → depth shift (0, 1, etc.)
const depthShiftMap = new Map(); // newAbs → how many levels deeper

for (const group of sorted) {
  for (const file of group.files) {
    const oldRel = `${group.directory}/${file}`;
    const oldAbsBase = join(rootDir, oldRel).replace(/\.[^.]+$/, '');
    if (moveMap.has(oldAbsBase)) continue; // longer prefix handled it

    const ext = extname(file);
    const stem = file.slice(0, -ext.length);
    const newStem = stem.slice(group.prefix.length + 1);
    const newRel = `${group.directory}/${group.prefix}/${newStem}`;
    const newAbsBase = join(rootDir, newRel);

    const oldDirDepth = group.directory.split('/').length;
    const newDirDepth = `${group.directory}/${group.prefix}`.split('/').length;
    const shift = newDirDepth - oldDirDepth;

    moveMap.set(oldAbsBase, newAbsBase);
    moveMap.set(join(rootDir, oldRel), newAbsBase);
    depthShiftMap.set(newAbsBase, shift);
  }
}

function* walkFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const skip = ['node_modules', '.git', 'dist', 'artifacts', '.moon', '.next'];
    if (skip.includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkFiles(full);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs|json|md|mdx|yml|yaml|css)$/.test(entry.name)) yield full;
  }
}

function adjustDepth(specifier, shift) {
  // Prepend `../` for each level of depth increase
  // Strip leading ./ first to avoid ../../ doubling
  if (shift <= 0) return specifier;
  const clean = specifier.replace(/^\.\//, '');
  return '../'.repeat(shift) + clean;
}

const importRe = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)(['"])(\.[^'"]+)\1/g;

console.log('Fixing imports (v4)...\n');
let totalFiles = 0;
let totalChanges = 0;

for (const filePath of walkFiles(rootDir)) {
  const content = readFileSync(filePath, 'utf8');
  const _modified = false;
  let changesInFile = 0;
  const fromDir = dirname(filePath);

  const newContent = content.replace(importRe, (fullMatch, quote, specifier) => {
    const resolvedBase = normalize(join(fromDir, specifier));

    // Try all extension/index candidates to find in moveMap
    const candidates = [
      resolvedBase,
      `${resolvedBase}.ts`,
      `${resolvedBase}.tsx`,
      `${resolvedBase}.js`,
      `${resolvedBase}.jsx`,
      `${resolvedBase}.mjs`,
      `${resolvedBase}/index.ts`,
      `${resolvedBase}/index.tsx`,
      `${resolvedBase}/index.js`,
    ];

    for (const candidate of candidates) {
      const newAbs = moveMap.get(candidate);
      if (newAbs) {
        let newRel = relative(fromDir, newAbs);
        if (!newRel.startsWith('.')) newRel = `./${newRel}`;
        newRel = newRel.replace(/\/index$/, '');
        changesInFile++;
        return `from ${quote}${newRel}${quote}`;
      }
    }

    // Check if THIS file (filePath) is itself a moved file
    // If so, and the import didn't match above, adjust by depth shift
    const fileAbsBase = filePath.replace(/\.[^.]+$/, '');
    const shift = depthShiftMap.get(fileAbsBase);
    if (shift && shift > 0) {
      const adjusted = adjustDepth(specifier, shift);
      if (adjusted !== specifier) {
        changesInFile++;
        return `from ${quote}${adjusted}${quote}`;
      }
    }

    return fullMatch;
  });

  if (newContent !== content) {
    if (!dryRun) writeFileSync(filePath, newContent);
    const rel = relative(rootDir, filePath);
    console.log(`  📝 ${rel} (${changesInFile} imports)`);
    totalFiles++;
    totalChanges += changesInFile;
  }
}

console.log(`\n✅ Updated ${totalChanges} imports across ${totalFiles} files.`);
if (dryRun) console.log('(dry run — no files modified)');
