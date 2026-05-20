import { parseJsonObject } from '../completion/index.ts';

export function validateChangelogJson(content, scopeLabel) {
  const parsed = parseJsonObject(content);
  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
    throw new Error(`Invalid changelog JSON for ${scopeLabel}: missing summary`);
  }
  const entry = Array.isArray(parsed.entryLines)
    ? parsed.entryLines.filter((line) => typeof line === 'string').join('\n')
    : parsed.entry;
  if (typeof entry !== 'string' || !entry.trim()) {
    throw new Error(`Invalid changelog JSON for ${scopeLabel}: missing entry`);
  }
  return {
    summary: parsed.summary.trim(),
    entry: entry.trim(),
    risks: Array.isArray(parsed.risks)
      ? parsed.risks
          .filter((risk) => typeof risk === 'string' && risk.trim())
          .map((risk) => risk.trim())
      : [],
  };
}

export function validateCommitJson(content) {
  const parsed = parseJsonObject(content);
  if (typeof parsed.subject !== 'string') throw new Error('Invalid commit JSON: missing subject');
  const subject = normalizeCommitSubject(parsed.subject);
  const body = Array.isArray(parsed.bodyLines)
    ? parsed.bodyLines.filter((line) => typeof line === 'string').join('\n')
    : parsed.body;
  return {
    subject,
    body: typeof body === 'string' ? body.trim() : '',
    filesToStage: Array.isArray(parsed.filesToStage)
      ? parsed.filesToStage
          .filter((file) => typeof file === 'string' && file.trim())
          .map((file) => file.trim())
      : [],
    risks: Array.isArray(parsed.risks)
      ? parsed.risks
          .filter((risk) => typeof risk === 'string' && risk.trim())
          .map((risk) => risk.trim())
      : [],
  };
}

export function normalizeCommitSubject(rawSubject) {
  const cleaned = rawSubject
    .trim()
    .replace(/^commit message:\s*/i, '')
    .replace(/[`*]+$/g, '')
    .replace(/\s+/g, ' ');
  if (
    /^(feat|fix|chore|docs|refactor|test|style|perf|ci|build|revert)(\(.+\))?!?:\s/.test(cleaned)
  ) {
    return cleaned.slice(0, 72);
  }
  const type = inferCommitType(cleaned);
  const withoutTerminalPunctuation = cleaned.replace(/[.?!]+$/g, '');
  return `${type}: ${withoutTerminalPunctuation}`.slice(0, 72);
}

export function inferCommitType(subject) {
  const text = subject.toLowerCase();
  if (/\b(fix|repair|correct|resolve)\b/.test(text)) return 'fix';
  if (/\b(doc|docs|readme|documentation)\b/.test(text)) return 'docs';
  if (/\b(test|spec|coverage)\b/.test(text)) return 'test';
  if (/\b(build|dependency|dependencies|package|lockfile|vite|tsx)\b/.test(text)) return 'build';
  if (/\b(ci|workflow|pipeline)\b/.test(text)) return 'ci';
  if (/\b(perf|performance|optimize)\b/.test(text)) return 'perf';
  if (/\b(style|format|lint)\b/.test(text)) return 'style';
  if (/\b(refactor|migrate|move|rename|restructure|split)\b/.test(text)) return 'refactor';
  return 'chore';
}
