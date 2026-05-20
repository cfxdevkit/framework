import { unique } from '../shared/logging.ts';

export function parseJsonObject(content) {
  const text = content.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]?.trim();
  const candidate = fenced ?? extractJsonObjectCandidate(text);
  if (!candidate?.startsWith('{')) {
    throw new Error(`LLM did not return a JSON object: ${text.slice(0, 120)}`);
  }
  return parseJsonWithRepairs(candidate);
}

export function extractJsonObjectCandidate(text) {
  const start = text.indexOf('{');
  const end = findBalancedJsonEnd(text, start);
  if (start === -1) return '';
  return text.slice(start, end > start ? end + 1 : text.lastIndexOf('}') + 1);
}

export function findBalancedJsonEnd(text, start) {
  if (start < 0) return -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) return index;
    }
  }
  return -1;
}

export function parseJsonWithRepairs(candidate) {
  const attempts = [
    candidate,
    escapeRawNewlinesInJsonStrings(candidate),
    stripTrailingCommas(escapeRawNewlinesInJsonStrings(candidate)),
  ];
  let lastError = null;
  for (const attempt of unique(attempts) as string[]) {
    try {
      return JSON.parse(attempt);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw lastError;
}

export function escapeRawNewlinesInJsonStrings(text) {
  let output = '';
  let inString = false;
  let escaped = false;
  for (const char of text) {
    if (inString) {
      if (escaped) {
        output += char;
        escaped = false;
        continue;
      }
      if (char === '\\') {
        output += char;
        escaped = true;
        continue;
      }
      if (char === '"') inString = false;
      if (char === '\n') output += '\\n';
      else if (char === '\r') output += '\\r';
      else output += char;
      continue;
    }
    if (char === '"') inString = true;
    output += char;
  }
  return output;
}

export function stripTrailingCommas(text) {
  return text.replace(/,\s*([}\]])/g, '$1');
}
