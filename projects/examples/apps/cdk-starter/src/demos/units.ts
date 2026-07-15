import { formatCFX, parseCFX, formatGDrip, parseGDrip, formatToken, stringifyBigInt, MAX_UINT256, MAX_UINT128, ZERO_ADDRESS } from '@cfxdevkit/cdk/units';

export async function demoUnits(): Promise<void> {
  console.log('\n  Both spaces share the same native token (CFX, 18 decimals)');
  console.log('  and the same drip unit. Gas pricing uses Gdrip (9 decimals).');

  console.log('\n  ── CFX formatting ───────────────────────────────────────');
  console.log(`    1 CFX   = ${1_000_000_000_000_000_000n} drip → "${formatCFX(1_000_000_000_000_000_000n)}"`);
  console.log(`    2.5 CFX = ${2_500_000_000_000_000_000n} drip → "${formatCFX(2_500_000_000_000_000_000n)}"`);
  console.log(`    0.001 CFX = "${formatCFX(1_000_000_000_000_000n)}"`);

  console.log('\n  ── CFX parsing ──────────────────────────────────────────');
  console.log(`    parseCFX('1')      → ${parseCFX('1')} drip`);
  console.log(`    parseCFX('0.5')    → ${parseCFX('0.5')} drip`);
  console.log(`    parseCFX('1234.56789') → ${parseCFX('1234.56789')} drip`);

  console.log('\n  ── Gdrip (gas-price unit, 9 decimals) ───────────────────');
  console.log(`    formatGDrip(1e9)      = "${formatGDrip(1_000_000_000n)}" Gdrip`);
  console.log(`    formatGDrip(123e6)    = "${formatGDrip(123_000_000n)}" Gdrip`);
  console.log(`    parseGDrip('20')      → ${parseGDrip('20')} drip`);

  console.log('\n  ── Token formatting (any ERC-20) ────────────────────────');
  console.log(`    100 USDC (6 dec)  → "${formatToken(100_000_000n, { decimals: 6, symbol: 'USDC' })}"`);
  console.log(`    1.25 DAI  (18 dec) → "${formatToken(1_250_000_000_000_000_000n, { decimals: 18, symbol: 'DAI' })}"`);

  console.log('\n  ── JSON serialisation (bigint → string) ─────────────────');
  console.log(`    ${stringifyBigInt({ balance: 1_000_000n, nonce: 42n }, 2)}`);

  console.log('\n  ── Constants ────────────────────────────────────────────');
  console.log(`    MAX_UINT256 → ${stringifyBigInt({ max: MAX_UINT256 })}`);
  console.log(`    MAX_UINT128 → ${stringifyBigInt({ max: MAX_UINT128 })}`);
  console.log(`    ZERO_ADDRESS → ${ZERO_ADDRESS}`);
}
