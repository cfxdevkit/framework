// @ts-nocheck
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parseJsonObject } from './lemonade-completion.ts';
import { root } from './lemonade-shared.ts';

export function validateDocsReplacementJson(content) {
  const parsed = parseJsonObject(content);
  return Array.isArray(parsed.replacements)
    ? parsed.replacements
        .map((replacement) => normalizeDocsReplacement(replacement))
        .filter(Boolean)
    : [];
}

export async function buildDocsFolderContext(scope, maxChars) {
  const parts = [];
  for (const file of scope.files) {
    try {
      const info = await stat(join(root, file));
      if (info.size > 256 * 1024) continue;
      const content = await readFile(join(root, file), 'utf8');
      parts.push(`--- ${file} ---\n${content.slice(0, 12000)}`);
    } catch {
      // skip files that disappeared during the run
    }
  }
  return parts.join('\n\n').slice(0, maxChars);
}

export function validateDocsUpkeepJson(content, scopeLabel) {
  const parsed = parseJsonObject(content);
  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
    throw new Error(`Invalid docs-upkeep JSON for ${scopeLabel}: missing summary`);
  }
  const artifact = Array.isArray(parsed.artifactLines)
    ? parsed.artifactLines.filter((line) => typeof line === 'string').join('\n')
    : parsed.artifact;
  if (typeof artifact !== 'string' || !artifact.trim()) {
    throw new Error(`Invalid docs-upkeep JSON for ${scopeLabel}: missing artifactLines`);
  }
  return {
    summary: parsed.summary.trim(),
    artifact: artifact.trim(),
    followups: Array.isArray(parsed.followups)
      ? parsed.followups
          .filter((followup) => typeof followup === 'string' && followup.trim())
          .map((followup) => followup.trim())
      : [],
    replacements: Array.isArray(parsed.replacements)
      ? parsed.replacements
          .map((replacement) => normalizeDocsReplacement(replacement))
          .filter(Boolean)
      : [],
    fileUpdates: Array.isArray(parsed.fileUpdates)
      ? parsed.fileUpdates.map((update) => normalizeDocsFileUpdate(update)).filter(Boolean)
      : [],
  };
}

export function normalizeDocsReplacement(replacement) {
  if (
    !replacement ||
    typeof replacement.path !== 'string' ||
    !Array.isArray(replacement.oldLines) ||
    !Array.isArray(replacement.newLines)
  ) {
    return null;
  }
  const path = replacement.path.trim().replace(/^\.\//, '');
  const oldText = replacement.oldLines.filter((line) => typeof line === 'string').join('\n');
  const newText = replacement.newLines.filter((line) => typeof line === 'string').join('\n');
  if (!path.endsWith('.md') || !oldText.trim()) return null;
  return { path, oldText, newText };
}

export function normalizeDocsFileUpdate(update) {
  if (!update || typeof update.path !== 'string' || !Array.isArray(update.contentLines)) {
    return null;
  }
  const path = update.path.trim().replace(/^\.\//, '');
  const content = update.contentLines
    .filter((line) => typeof line === 'string')
    .join('\n')
    .trimEnd();
  if (!path.endsWith('.md') || !content.trim()) return null;
  return { path, content: `${content}\n` };
}
