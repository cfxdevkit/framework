/**
 * CDK Starter — live demo
 *
 * Executable walkthrough of the @cfxdevkit/cdk API surface.
 * Run:  pnpm demo   (or npx tsx src/demo.ts)
 *
 * Sections 1-4 are pure (no network). Section 5 calls testnet RPC live.
 * Section 6 derives wallet addresses locally (no broadcast).
 */
import { demoChains } from './demos/chains.js';
import { demoUnits } from './demos/units.js';
import { demoAddress } from './demos/address.js';
import { demoErrors } from './demos/errors.js';
import { demoClientLive } from './demos/client-live.js';
import { demoWallet } from './demos/wallet.js';

const header = (title: string) => {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(60)}`);
};

async function main(): Promise<void> {
  console.log('\n  🦊  Conflux DevKit — CDK Starter Demo\n');

  header('1. Chains — static chain configs');
  await demoChains();

  header('2. Units — CFX / drip / Gdrip conversions');
  await demoUnits();

  header('3. Address — hex ↔ base32 codec');
  await demoAddress();

  header('4. Errors — typed error hierarchy');
  await demoErrors();

  header('5. Client (live) — testnet RPC calls');
  await demoClientLive();

  header('6. Wallet — generate, derive, sign locally');
  await demoWallet();

  console.log('\n  ✅  Demo complete.\n');
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
