#!/usr/bin/env node
/**
 * Verify that docs-site content is complete after sync.
 *
 * Called during Docker build (after sync all, before next build).
 * Exits with code 1 if critical content is missing.
 *
 * Checks:
 *  - content/quickstart.mdx exists (required)
 *  - content/packages/ has >= 20 package pages
 *  - content/releases.mdx exists (warn if missing)
 *  - content/guides/index.mdx exists (warn if missing)
 *  - content/api.mdx exists (warn if missing)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '..', 'content');

const errors = [];
const warnings = [];

// Check required files
const required = ['quickstart.mdx'];
for (const file of required) {
  const filePath = path.join(contentDir, file);
  try {
    await fs.access(filePath);
  } catch {
    errors.push(`Missing required file: content/${file}`);
  }
}

// Check package page count
const packagesDir = path.join(contentDir, 'packages');
try {
  const packageFiles = await fs.readdir(packagesDir);
  const mdxFiles = packageFiles.filter((f) => f.endsWith('.mdx') && f !== '_meta.js');
  if (mdxFiles.length < 20) {
    errors.push(`Only ${mdxFiles.length} package pages found (expected >= 20)`);
  } else {
    console.log(`✓ ${mdxFiles.length} package pages found`);
  }
} catch {
  errors.push('packages/ directory not found or not readable');
}

// Check optional files (warn but don't fail)
const optional = [
  { path: 'releases.mdx', name: 'Releases page' },
  { path: 'guides/index.mdx', name: 'Guides index' },
  { path: 'api.mdx', name: 'API Reference' },
];

for (const { path: filePath, name } of optional) {
  const fullpath = path.join(contentDir, filePath);
  try {
    await fs.access(fullpath);
    console.log(`✓ ${name} exists`);
  } catch {
    warnings.push(`${name} not found (content/${filePath})`);
  }
}

// Report results
if (errors.length > 0) {
  console.error('\n❌ Content verification failed:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

if (warnings.length > 0) {
  console.log('\n⚠️  Content verification warnings:');
  for (const warning of warnings) {
    console.log(`  - ${warning}`);
  }
}

console.log('\n✅ Content verification passed');
