import { stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { Finding } from '../../runtime.js';
import { inlineCodePattern, markdownLinkPattern, root } from '../../runtime.js';

export async function findBrokenPathRefs(path: string, content: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const { raw, source } of extractPathRefs(content)) {
    const ref = raw.split('#')[0] ?? '';
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
        // try next candidate
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

export function findCurrentPlannedDrift(path: string, content: string): Finding[] {
  if (
    /planned|target state|future/i.test(content) &&
    !/current|checked-in|present/i.test(content) &&
    path.endsWith('STRUCTURE.md')
  ) {
    return [
      {
        severity: 'warning',
        file: path,
        issue: 'Planned structure language appears without an explicit current-state marker.',
        recommendation: 'Label planned topology separately from checked-in structure.',
      },
    ];
  }
  return [];
}

function extractPathRefs(content: string): { raw: string; source: 'link' | 'code' }[] {
  const refs: { raw: string; source: 'link' | 'code' }[] = [];
  const withoutFencedBlocks = content.replace(/```[\s\S]*?```/g, '');
  for (const match of withoutFencedBlocks.matchAll(markdownLinkPattern)) {
    refs.push({ raw: (match[1] ?? '').trim(), source: 'link' });
  }
  for (const match of withoutFencedBlocks.matchAll(inlineCodePattern)) {
    refs.push({ raw: (match[1] ?? '').trim(), source: 'code' });
  }
  return refs;
}

function looksLikeLocalPath(ref: string, source: 'link' | 'code'): boolean {
  if (!ref || ref.startsWith('http:') || ref.startsWith('https:') || ref.startsWith('mailto:')) {
    return false;
  }
  if (ref.startsWith('#') || ref.startsWith('/') || ref.startsWith('@') || ref.includes('@')) {
    return false;
  }
  if (ref.includes('*') || /[<>{}\s]/.test(ref)) return false;
  if (source === 'code') {
    if (
      /^(README\.md|ARCHITECTURE\.md|CHANGELOG\.md|CLAUDE\.md|CONTRIBUTING\.md|MIGRATION\.md|OPENSPEC\.md|SECURITY\.md|package\.json|pnpm-workspace\.yaml|biome\.json)$/.test(
        ref,
      )
    ) {
      return true;
    }

    if (
      /^(\.github\/|\.moon\/|docs\/|infrastructure\/|openspec\/|projects\/|repos\/|scripts\/)/.test(
        ref,
      )
    ) {
      return true;
    }

    if (/^\.\.?\//.test(ref)) {
      return /\/$|\.[a-z0-9]+$/i.test(ref);
    }

    return false;
  }
  return /[/.]/.test(ref);
}

function resolveDocRefCandidates(docPath: string, ref: string): string[] {
  const local = resolve(dirname(join(root, docPath)), ref);
  if (ref.startsWith('./') || ref.startsWith('../')) return [local];
  return [local, resolve(root, ref)];
}
