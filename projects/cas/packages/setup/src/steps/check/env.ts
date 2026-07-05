import { input } from '@inquirer/prompts';
import type { WizardState } from '../../wizard';

function parseMajorVersion(version: string): number {
  const match = /^v?(\d+)/.exec(version);
  return match?.[1] !== undefined ? parseInt(match[1], 10) : 0;
}

export async function checkRpc(url: string): Promise<string> {
  let currentUrl = url;
  while (true) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000);
      const res = await fetch(currentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = (await res.json()) as { result?: string };
      if (typeof data.result === 'string') {
        const blockNum = parseInt(data.result, 16);
        console.log(`✓ RPC OK (block #${blockNum}) — ${currentUrl}`);
        return currentUrl;
      }
      throw new Error('RPC returned no result');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`✗ RPC unreachable: ${currentUrl} — ${message}`);
      const newUrl = await input({
        message: 'Enter alternate RPC URL (or leave blank to abort):',
      });
      if (!newUrl.trim()) {
        console.error('Aborting — RPC is required to continue.');
        process.exit(1);
      }
      currentUrl = newUrl.trim();
    }
  }
}

export async function checkEnv(state: WizardState): Promise<WizardState> {
  console.log('\n── Environment Check ─────────────────────────────────');

  // Node.js version check
  const major = parseMajorVersion(process.version);
  if (major < 24) {
    console.error(`✗ Node.js ${process.version} detected — requires v24 or higher`);
    process.exit(1);
  }
  console.log(`✓ Node.js ${process.version}`);

  // RPC check is deferred to the network selection phase where we know the URL.
  // This phase only checks Node version.
  return state;
}
