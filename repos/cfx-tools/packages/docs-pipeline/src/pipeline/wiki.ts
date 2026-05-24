import { syncWiki } from '../wiki-sync.js';
import { validateWikiMermaid } from '../wiki-validate.js';

export async function syncWikiContent(): Promise<number> {
  return syncWiki();
}

export async function validateWikiContent(options: { fix?: boolean } = {}) {
  return validateWikiMermaid(options);
}
