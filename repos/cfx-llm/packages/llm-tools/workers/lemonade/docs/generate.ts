// @ts-nocheck
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { completeStructuredAgent } from '../completion/index.ts';
import { repoActions, root } from '../shared/index.ts';
import {
  buildDocsFolderContext,
  validateDocsReplacementJson,
  validateDocsUpkeepJson,
} from './validate.ts';

export async function generateDocsUpkeepArtifact(scope, baseContext, flags, childContext = '') {
  const folderContext = await buildDocsFolderContext(scope, flags.quick ? 20000 : 36000);
  const retryFolderContext = await buildDocsFolderContext(scope, flags.quick ? 12000 : 24000);
  const prompt = [
    flags.prompt || repoActions['docs-upkeep'].defaultPrompt,
    '',
    `Folder scope: ${scope.label}`,
    `Files: ${scope.files.join(', ')}`,
    '',
    'Repository docs context:',
    baseContext,
    childContext ? `\n${childContext}` : '',
    '',
    'Folder contents:',
    folderContext,
  ]
    .filter((s) => s !== '')
    .join('\n');
  const response = await completeDocsUpkeepArtifact({
    flags,
    userPrompt: prompt,
    maxTokens: flags.write ? (flags.quick ? 3200 : 5200) : flags.quick ? 1600 : 2600,
  });
  try {
    return validateDocsUpkeepJson(response.content, scope.label);
  } catch {
    const retryPrompt = [
      flags.prompt || repoActions['docs-upkeep'].defaultPrompt,
      '',
      `Folder scope: ${scope.label}`,
      `Existing files: ${scope.files.join(', ')}`,
      '',
      'Write a concise artifact. Keep each artifactLines item short. Do not include nested JSON, markdown fences, or raw multiline strings.',
      '',
      'Repository docs context:',
      baseContext.slice(0, flags.quick ? 5000 : 12000),
      childContext ? `\n${childContext.slice(0, flags.quick ? 2000 : 6000)}` : '',
      '',
      'Folder contents:',
      retryFolderContext,
    ]
      .filter((s) => s !== '')
      .join('\n');
    const retryResponse = await completeDocsUpkeepArtifact({
      flags,
      userPrompt: retryPrompt,
      maxTokens: flags.write ? (flags.quick ? 2600 : 4200) : flags.quick ? 1200 : 2000,
    });
    try {
      return validateDocsUpkeepJson(retryResponse.content, scope.label);
    } catch {
      return fallbackDocsUpkeepArtifact(scope, retryResponse.content);
    }
  }
}

export function fallbackDocsUpkeepArtifact(scope, content) {
  return {
    summary: `Captured fallback docs-upkeep note for ${scope.label}; strict JSON was unavailable.`,
    artifact: [
      '## Current State',
      '',
      'The local model returned malformed JSON for this folder, so the raw bounded response is preserved for review.',
      '',
      '## Model Response Excerpt',
      '',
      content.trim().slice(0, 4000) || '(empty response)',
      '',
      '## Validation',
      '',
      '- Review the preserved model excerpt before applying broad documentation updates.',
    ].join('\n'),
    followups: [`Review fallback docs-upkeep output for ${scope.label} before applying edits.`],
    replacements: [],
    fileUpdates: [],
  };
}

export async function completeDocsUpkeepArtifact({ flags, userPrompt, maxTokens }) {
  return completeStructuredAgent({
    action: 'docs-upkeep',
    flags,
    systemPrompt: [
      'You are a documentation maintainer for a TypeScript monorepo.',
      'Return strict JSON only, with no markdown fence and no explanatory text.',
      'Use artifactLines and followups arrays so each markdown line or action item is a separate JSON string.',
      'When asked to write docs, prefer compact exact replacements with oldLines and newLines arrays.',
      'The Files list is authoritative: do not recommend creating a file that is already listed there.',
    ].join(' '),
    userPrompt: [
      'Schema: {"summary":"one sentence","artifactLines":["markdown line"],"followups":["action item"],"replacements":[{"path":"existing markdown path","oldLines":["exact old line"],"newLines":["replacement line"]}],"fileUpdates":[{"path":"existing markdown path","contentLines":["complete file line"]}]}.',
      'The artifact should be a practical folder-level upkeep note with sections: Current State, Drift or Gaps, Recommended Edits, Validation.',
      flags.write
        ? 'Also include replacements for safe exact edits of existing markdown files in this folder scope. Use fileUpdates only if an exact replacement cannot express the edit compactly.'
        : 'Do not include fileUpdates unless the command is running in write mode.',
      flags.write && flags.quick
        ? 'In quick write mode, include at most one replacement for one existing file and keep artifactLines concise.'
        : '',
      'Prefer concrete file-specific edits. Do not invent checked-in files or claim edits were applied.',
      'If a file is listed in the folder scope, treat it as existing even if its contents are truncated.',
      userPrompt,
    ].join('\n'),
    maxTokens,
  });
}

export async function generateDocsUpkeepReplacements(scope, baseContext, flags, childContext = '') {
  const folderContext = await buildDocsFolderContext(scope, flags.quick ? 14000 : 28000);
  const userPrompt = [
    `Folder scope: ${scope.label}`,
    `Existing files: ${scope.files.join(', ')}`,
    '',
    'Repository docs context:',
    baseContext.slice(0, flags.quick ? 4000 : 10000),
    childContext ? `\n${childContext.slice(0, flags.quick ? 2000 : 6000)}` : '',
    '',
    'Folder contents:',
    folderContext,
    '',
    'Return only safe exact replacements for existing files in this folder. Do not create files. Do not rewrite complete files.',
  ]
    .filter((s) => s !== '')
    .join('\n');
  const response = await completeStructuredAgent({
    action: 'docs-upkeep',
    flags,
    systemPrompt: [
      'You are a documentation editor for a TypeScript monorepo.',
      'Return strict JSON only, with no markdown fence and no explanatory text.',
      'Use compact exact replacements. Each replacement oldLines block must match existing content exactly.',
    ].join(' '),
    userPrompt: [
      'Schema: {"replacements":[{"path":"existing markdown path","oldLines":["exact old line"],"newLines":["replacement line"]}],"followups":["action item"]}.',
      flags.quick
        ? 'In quick mode, include at most one replacement.'
        : 'Include only high-confidence replacements.',
      userPrompt,
    ].join('\n'),
    maxTokens: flags.quick ? 1200 : 2400,
  });
  try {
    const replacements = validateDocsReplacementJson(response.content);
    if (replacements.length > 0) return replacements;
  } catch {
    // fall through to narrower retry
  }
  return generateSingleDocsReplacement(scope, flags);
}

export async function generateSingleDocsReplacement(scope, flags) {
  const file = scope.files[0];
  if (!file) return [];
  const content = await readFile(join(root, file), 'utf8');
  const response = await completeStructuredAgent({
    action: 'docs-upkeep',
    flags,
    systemPrompt: [
      'You are a documentation editor for a TypeScript monorepo.',
      'Return strict JSON only, with no markdown fence and no explanatory text.',
      'Return at most one exact replacement. If no safe edit exists, return {"replacements":[]}.',
    ].join(' '),
    userPrompt: [
      'Schema: {"replacements":[{"path":"existing markdown path","oldLines":["exact old line"],"newLines":["replacement line"]}]}',
      `Path: ${file}`,
      'Task: make one conservative documentation upkeep edit if the file has stale, unclear, or incomplete wording.',
      'File content:',
      content.slice(0, flags.quick ? 10000 : 20000),
    ].join('\n'),
    maxTokens: flags.quick ? 900 : 1600,
  });
  try {
    return validateDocsReplacementJson(response.content);
  } catch {
    return [];
  }
}
