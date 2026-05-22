import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { completeStructuredAgent } from '../completion/index.ts';
import { repoActions, root } from '../shared/index.ts';
import { createLlmProgressReporter } from '../shared/logging.ts';
import {
  buildDocsFolderContext,
  validateDocsReplacementJson,
  validateDocsUpkeepJson,
} from './validate.ts';

export function resolveDocsUpkeepArtifactMaxTokens(promptBody, flags) {
  const promptChars = Math.min(promptBody.length, flags.quick ? 10000 : 22000);
  const approximatePromptTokens = Math.ceil(promptChars / 4);
  const estimatedOutputTokens = Math.ceil(approximatePromptTokens * 0.9);

  if (flags.quick) {
    return Math.min(8000, Math.max(2400, estimatedOutputTokens + 1600));
  }

  return Math.min(32000, Math.max(12000, estimatedOutputTokens + 9000));
}

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
    scopeLabel: scope.label,
    userPrompt: prompt,
    maxTokens: resolveDocsUpkeepArtifactMaxTokens(prompt, flags),
  });
  const parsed = parseDocsUpkeepArtifactResponse(scope, response.content ?? '');
  if (parsed) {
    return parsed;
  }

    const retryPrompt = [
      flags.prompt || repoActions['docs-upkeep'].defaultPrompt,
      '',
      `Folder scope: ${scope.label}`,
      `Existing files: ${scope.files.join(', ')}`,
      '',
      'Write the final folder upkeep artifact directly as markdown.',
      'Use sections: Current State, Drift or Gaps, Recommended Edits, Validation.',
      'Do not return JSON, markdown fences, or planning text.',
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
      scopeLabel: scope.label,
      userPrompt: retryPrompt,
      maxTokens: resolveDocsUpkeepArtifactMaxTokens(retryPrompt, flags),
    });
    return parseDocsUpkeepArtifactResponse(scope, retryResponse.content ?? '')
      ?? fallbackDocsUpkeepArtifact(scope, retryResponse.content ?? '');
}

export function fallbackDocsUpkeepArtifact(scope, content) {
  return {
    summary: `Captured fallback docs-upkeep note for ${scope.label}; the model response was not reusable as a final artifact.`,
    artifact: [
      '## Current State',
      '',
      'The local model returned output that could not be normalized into a final folder artifact, so the raw bounded response is preserved for review.',
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

export function parseDocsUpkeepArtifactResponse(scope, rawResponse) {
  const raw = rawResponse.trim();
  if (!raw) return null;

  try {
    return validateDocsUpkeepJson(raw, scope.label);
  } catch {
    // fall through to direct-markdown normalization
  }

  const fencedMarkdown = raw.match(/```(?:markdown|md)?\n([\s\S]+?)```/i)?.[1]?.trim();
  const artifact = normalizeDocsUpkeepArtifactMarkdown(fencedMarkdown ?? raw);
  if (!artifact) return null;

  return {
    summary: summarizeDocsUpkeepArtifact(scope.label, artifact),
    artifact,
    followups: extractDocsUpkeepFollowups(artifact),
    replacements: [],
    fileUpdates: [],
  };
}

function normalizeDocsUpkeepArtifactMarkdown(content) {
  const normalized = content.trim();
  if (!normalized) return '';
  if (normalized.startsWith('{') || normalized.startsWith('[')) return '';
  return normalized;
}

function summarizeDocsUpkeepArtifact(scopeLabel, artifact) {
  const lines = artifact
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const candidate = lines.find(
    (line) =>
      !line.startsWith('#') &&
      !line.startsWith('```') &&
      !line.startsWith('- ') &&
      !line.startsWith('* '),
  );
  const summary = candidate?.replace(/[*_`]/g, '').trim();
  if (!summary) return `Captured docs upkeep artifact for ${scopeLabel}.`;
  return summary.length <= 140 ? summary : `${summary.slice(0, 137).trimEnd()}...`;
}

function extractDocsUpkeepFollowups(artifact) {
  const lines = artifact
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- ') || line.startsWith('* '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
  return [...new Set(lines)].slice(0, 8);
}

export async function completeDocsUpkeepArtifact({ flags, scopeLabel, userPrompt, maxTokens }) {
  return completeStructuredAgent({
    action: 'docs-upkeep',
    flags,
    systemPrompt: [
      'You are a documentation maintainer for a TypeScript monorepo.',
      'Return ONLY the final folder upkeep artifact as markdown with no JSON, markdown fence, or planning text.',
      'Start with the final artifact immediately.',
      'Use sections: Current State, Drift or Gaps, Recommended Edits, Validation.',
      'Keep the artifact concise, concrete, and tied to the listed files only.',
      'Do not claim edits were applied.',
      'The Files list is authoritative: do not invent checked-in files.',
    ].join(' '),
    userPrompt,
    maxTokens,
    onProgress: createLlmProgressReporter(scopeLabel),
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
    onProgress: createLlmProgressReporter(`${scope.label} replacements`),
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
    onProgress: createLlmProgressReporter(`${scope.label} single-file replacement`),
  });
  try {
    return validateDocsReplacementJson(response.content);
  } catch {
    return [];
  }
}
