import { syncWiki } from '../wiki-sync.js';
import { updateWiki } from '../wiki-update.js';
import { validateWikiMermaid } from '../wiki-validate.js';

export async function syncWikiContent(): Promise<number> {
  return syncWiki();
}

export async function regenerateWiki(options: { args?: readonly string[] } = {}): Promise<void> {
  await updateWiki(options);
}

export async function validateWikiContent(options: { fix?: boolean } = {}) {
  return validateWikiMermaid(options);
}
