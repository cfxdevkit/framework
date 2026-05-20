import { stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { inlineCodePattern, markdownLinkPattern, root } from './constants.ts';

export async function findBrokenPathRefs(path, content) {
  const findings = [];
  for (const { raw, source } of extractPathRefs(content)) {
    const ref = raw.split('#')[0];
    if (!looksLikeLocalPath(ref, source)) continue;
    const candidates = resolveDocRefCandidates(path, ref);
    if (candidates.some((candidate) => !candidate.startsWith(root))) {
      findings.push({
        severity: 'error',
        file: path,
        issue: `Path reference escapes repository: ${raw}`,
      });
      continue;
    }
    let found = false;
    for (const candidate of candidates) {
      try {
        await stat(candidate);
        found = true;
        break;
      } catch {
        // try the next candidate
      }
    }
    if (!found) {
      findings.push({
        severity: 'warning',
        file: path,
        issue: `Referenced path does not exist: ${raw}`,
      });
    }
  }
  return findings;
}

export function extractPathRefs(content) {
  const refs = [];
  const withoutFencedBlocks = content.replace(/```[\s\S]*?```/g, '');
  for (const match of withoutFencedBlocks.matchAll(markdownLinkPattern)) {
    refs.push({ raw: match[1].trim(), source: 'link' });
  }
  for (const match of withoutFencedBlocks.matchAll(inlineCodePattern)) {
    refs.push({ raw: match[1].trim(), source: 'code' });
  }
  return refs;
}

export function findCurrentPlannedDrift(path, content) {
  const findings = [];
  const hasPlanned = /planned|target state|future/i.test(content);
  const hasCurrent = /current|checked-in|present/i.test(content);
  if (hasPlanned && !hasCurrent && path.endsWith('STRUCTURE.md')) {
    findings.push({
      severity: 'warning',
      file: path,
      issue: 'Planned structure language appears without an explicit current-state marker.',
      recommendation: 'Label planned topology separately from checked-in structure.',
    });
  }
  return findings;
}

export function looksLikeLocalPath(ref, source) {
  if (!ref || ref.startsWith('http:') || ref.startsWith('https:') || ref.startsWith('mailto:'))
    return false;
  if (ref.startsWith('#')) return false;
  if (ref.startsWith('/')) return false;
  if (ref.startsWith('@') || ref.includes('@')) return false;
  if (ref.includes('*')) return false;
  if (ref.includes('<') || ref.includes('>') || ref.includes('{') || ref.includes('}'))
    return false;
  if (ref.includes(' ') || ref.includes('\n')) return false;
  if (source === 'code') {
    return /^(\.\.?\/|\.github\/|\.moon\/|docs\/|infrastructure\/|projects\/|repos\/|scripts\/|tools\/|README\.md|ARCHITECTURE\.md|CONTRIBUTING\.md|MIGRATION\.md|SECURITY\.md|package\.json|pnpm-workspace\.yaml|biome\.json)/.test(
      ref,
    );
  }
  return /[/.]/.test(ref);
}

export function resolveDocRefCandidates(docPath, ref) {
  const local = resolve(dirname(join(root, docPath)), ref);
  if (ref.startsWith('./') || ref.startsWith('../')) return [local];
  return [local, resolve(root, ref)];
}
