import { join } from 'node:path';
import { execFileAsync, root } from './constants.js';

export async function codeHotspotReport() {
  try {
    const { stdout } = await execFileAsync(
      'pnpm',
      [
        'exec',
        'tsx',
        join(root, 'repos/cfx-tools/packages/arch-check/src/bin/check-hotspots.js'),
        '--json',
      ],
      {
        cwd: root,
        maxBuffer: 1024 * 1024 * 10,
        signal: AbortSignal.timeout(120000),
      },
    );
    return JSON.parse(stdout);
  } catch (error) {
    return {
      status: 'error',
      policy: { softFileLineLimit: 250, hardFileLineLimit: 300 },
      totals: { hardViolations: 0, softWarnings: 0 },
      hardViolations: [],
      softWarnings: [],
      scanError: String(error?.message ?? error),
    };
  }
}

export function extractModelInventory(text) {
  try {
    const parsed = JSON.parse(text);
    const data = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : [];
    return data
      .map((model) => ({
        id: typeof model?.id === 'string' ? model.id : undefined,
        checkpoint: typeof model?.checkpoint === 'string' ? model.checkpoint : undefined,
        labels: Array.isArray(model?.labels)
          ? model.labels.filter((label) => typeof label === 'string')
          : [],
        recipe: typeof model?.recipe === 'string' ? model.recipe : undefined,
        size: typeof model?.size === 'number' ? model.size : undefined,
      }))
      .filter((model) => model.id || model.checkpoint);
  } catch {
    return [];
  }
}
