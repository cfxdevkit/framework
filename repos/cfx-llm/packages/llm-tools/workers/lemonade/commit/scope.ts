// @ts-nocheck
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { git } from '../completion/index.ts';
import { root } from '../shared/index.ts';

export async function detectChangedScopes() {
  const [modified, staged, untracked] = await Promise.all([
    git(['diff', '--name-only']).catch(() => ''),
    git(['diff', '--cached', '--name-only']).catch(() => ''),
    git(['ls-files', '--others', '--exclude-standard']).catch(() => ''),
  ]);
  const untrackedSet = new Set(untracked.split('\n').filter(Boolean));
  const allFiles = new Set([
    ...modified.split('\n').filter(Boolean),
    ...staged.split('\n').filter(Boolean),
    ...untracked.split('\n').filter(Boolean),
  ]);
  const groups = new Map();
  for (const file of allFiles) {
    const scope = resolveScope(file);
    if (!groups.has(scope.key)) {
      groups.set(scope.key, { ...scope, files: [], untrackedSet });
    }
    groups.get(scope.key).files.push(file);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export async function changedFilesList() {
  const [modified, staged, untracked] = await Promise.all([
    git(['diff', '--name-only']).catch(() => ''),
    git(['diff', '--cached', '--name-only']).catch(() => ''),
    git(['ls-files', '--others', '--exclude-standard']).catch(() => ''),
  ]);
  return [...new Set([modified, staged, untracked].join('\n').split('\n').filter(Boolean))].sort();
}

export function resolveScope(filepath) {
  const [top, second] = filepath.split('/');
  if ((top === 'repos' || top === 'tools' || top === 'projects') && second) {
    // If the second segment is not a directory on disk (for example a file
    // like `projects/README.md`), treat the scope as the top-level folder
    // so we don't attempt to create a changelog directory under a file path.
    try {
      const candidate = join(root, top, second);
      const s = statSync(candidate);
      if (!s.isDirectory()) {
        return { key: top, label: top, changelogPath: `${top}/CHANGELOG.md`, scopeGlob: `${top}` };
      }
    } catch {
      // If the path doesn't exist or cannot be stat'd, fall back to top-level
      return { key: top, label: top, changelogPath: `${top}/CHANGELOG.md`, scopeGlob: `${top}` };
    }
    return {
      key: `${top}/${second}`,
      label: `${top}/${second}`,
      changelogPath: `${top}/${second}/CHANGELOG.md`,
      scopeGlob: `${top}/${second}`,
    };
  }
  return { key: 'root', label: 'root', changelogPath: 'CHANGELOG.md', scopeGlob: null };
}

// ─── Per-scope changelog generation ──────────────────────────────────────────
