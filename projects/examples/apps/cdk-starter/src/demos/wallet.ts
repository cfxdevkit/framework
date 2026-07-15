import {
  generateMnemonic,
  deriveAccount,
  deriveDualAccount,
  deriveDualAccounts,
  signerFromDualMnemonic,
  signerFromMnemonic,
} from '@cfxdevkit/cdk/wallet';
import { resolveNetworkIds } from '@cfxdevkit/cdk/chains';
import { espaceTestnet, coreSpaceTestnet } from '@cfxdevkit/cdk/chains';

export async function demoWallet(): Promise<void> {
  console.log('\n  ══════════════════════════════════════════════════════════');
  console.log("  eSpace (EVM):  HD path m/44'/60'/0'/0/{index}");
  console.log("  Core Space:    HD path m/44'/503'/0'/0/{index}");
  console.log('  → Same mnemonic, different paths → independent keypairs');
  console.log('  ══════════════════════════════════════════════════════════');

  // ── 1. Generate mnemonic ──────────────────────────────────────────────
  console.log('\n  ── 1. Generate mnemonic ──────────────────────────────────');
  const mnemonic = generateMnemonic();
  console.log(`    ${mnemonic}`);
  console.log('    → Kept in memory only. Never logged, never committed.');

  // ── 2. Single-space derivation ────────────────────────────────────────
  console.log('\n  ── 2. deriveAccount (single space, any path) ────────────');
  console.log("    Path: m/44'/60'/0'/0/0  (eSpace, EIP-44 standard)");
  const evmAccount = deriveAccount({ mnemonic, path: "m/44'/60'/0'/0/0" });
  console.log(`    account.address:    ${evmAccount.account.address}  ← hex (viem)`);
  console.log('    account.signMessage() → EIP-191 signing (viem)');
  console.log('    account.signTransaction() → EIP-1559 signing (viem)');

  // ── 3. Core Space derivation via deriveAccount ────────────────────────
  console.log("\n    Path: m/44'/503'/0'/0/0  (Core Space, Conflux-native)");
  const coreAccount = deriveAccount({
    mnemonic,
    path: "m/44'/503'/0'/0/0",
    coreNetworkId: 1,
  });
  console.log(`    account.address:    ${coreAccount.account.address}  ← base32 (cive)`);
  console.log('    account.signMessage() → Core signing (cive)');
  console.log('    account.signTransaction() → CIP-1559 signing (cive)');

  console.log('\n    Both return { account } — full signing-capable object.');
  console.log(
    `    Different addresses: ${evmAccount.account.address !== coreAccount.account.address}`,
  );

  // ── 4. Dual-space derivation ──────────────────────────────────────────
  console.log('\n  ── 3. deriveDualAccount (both spaces at once) ───────────');
  const dual = deriveDualAccount({ mnemonic, coreNetworkId: 1 });
  console.log(`    evm.address:      ${dual.evm.address}  ← eSpace hex`);
  console.log(`    core.address:     ${dual.core.address}  ← Core base32`);
  console.log('    Both evm and core are full signing-capable account objects.');

  // ── 5. Mnemonic-based signers ─────────────────────────────────────────
  console.log('\n  ── 4. signerFromMnemonic (single-space) ─────────────────');
  console.log('    Creates a Signer from mnemonic + path.');
  const evmSigner = signerFromMnemonic({ mnemonic });
  console.log(`    address: ${evmSigner.account.address}  (eSpace hex)`);

  const coreSigner = signerFromMnemonic({
    mnemonic,
    path: "m/44'/503'/0'/0/0",
    coreNetworkId: 1,
  });
  console.log(`    address: ${coreSigner.account.address}  (Core base32)`);

  // ── 6. Cross-space signer ─────────────────────────────────────────────
  console.log('\n  ── 5. signerFromDualMnemonic (cross-space) ──────────────');
  const signer = signerFromDualMnemonic({ mnemonic, coreNetworkId: 1 });
  console.log(`    account.address:    ${signer.account.address}  (eSpace hex)`);
  console.log('    Dispatches by tx.family:');
  console.log('      - tx.family = "espace" → eSpace key (viem, EIP-1559)');
  console.log('      - tx.family = "core"   → Core key   (cive, CIP-1559)');
  console.log('      - signMessage()        → eSpace key (EIP-191)');

  // ── 7. Sign message ───────────────────────────────────────────────────
  console.log('\n  ── 6. Sign message (EIP-191) ────────────────────────────');
  const msg = 'Hello, Conflux!';
  const sig = await signer.signMessage(msg);
  console.log(`    message:   "${msg}"`);
  console.log(`    signer:    ${signer.account.address}`);
  console.log(`    signature: ${sig.slice(0, 30)}...`);

  // ── 8. Sign eSpace transaction ────────────────────────────────────────
  console.log('\n  ── 7. Sign eSpace transaction ───────────────────────────');
  const eSpaceTx = await signer.signTransaction({
    family: 'espace',
    chainId: espaceTestnet.id,
    to: '0x0000000000000000000000000000000000000000',
    value: 1n,
    nonce: 0,
    gas: 21_000n,
    maxFeePerGas: 20_000_000_000n,
    maxPriorityFeePerGas: 1_000_000_000n,
  });
  console.log(`    family:    espace`);
  console.log(`    chainId:   ${espaceTestnet.id}`);
  console.log(`    signed:    ${eSpaceTx.slice(0, 30)}...`);

  // ── 9. Sign Core Space transaction ────────────────────────────────────
  console.log('\n  ── 8. Sign Core Space transaction ───────────────────────');
  const coreTx = await signer.signTransaction({
    family: 'core',
    chainId: coreSpaceTestnet.id,
    to: 'cfxtest:aappz9187btk9p4xhtuame427w74xdseejznjh8230',
    value: 1n,
    nonce: 0,
    epochHeight: 256_000_000n,
    gas: 21_000n,
    storageLimit: 0n,
    coreType: 'cip1559',
    maxFeePerGas: 1_000_000_000n,
    maxPriorityFeePerGas: 100_000_000n,
  });
  console.log(`    family:    core`);
  console.log(`    chainId:   ${coreSpaceTestnet.id}`);
  console.log(`    signed:    ${coreTx.slice(0, 30)}...`);

  // ── 10. Multiple dual accounts ─────────────────────────────────────────
  console.log('\n  ── 9. Multiple dual accounts ────────────────────────────');
  const accounts = deriveDualAccounts({ mnemonic, count: 3, coreNetworkId: 1 });
  for (const acc of accounts) {
    console.log(`    [${acc.index}] evm: ${acc.evm.address}`);
    console.log(`          core:   ${acc.core.address}`);
  }

  // ── 11. Network ID resolution ─────────────────────────────────────────
  console.log('\n  ── 10. Network ID resolution ────────────────────────────');
  const testnetIds = resolveNetworkIds('testnet');
  console.log(`    testnet: espace=${testnetIds.espace}, core=${testnetIds.core}`);
  const mainnetIds = resolveNetworkIds('mainnet');
  console.log(`    mainnet: espace=${mainnetIds.espace}, core=${mainnetIds.core}`);

  // ── 12. API summary ───────────────────────────────────────────────────
  console.log('\n  ── 11. API summary ──────────────────────────────────────');
  console.log('    deriveAccount({ mnemonic, path, coreNetworkId? })');
  console.log('      → { account } — full signing-capable object');
  console.log('    deriveDualAccount({ mnemonic, index, coreNetworkId })');
  console.log('      → { evm: Account, core: Account, index, paths }');
  console.log('    signerFromMnemonic({ mnemonic, path, coreNetworkId? })');
  console.log('      → Signer (single space)');
  console.log('    signerFromDualMnemonic({ mnemonic, coreNetworkId })');
  console.log('      → Signer (dispatches by tx.family)');
  console.log('    resolveNetworkIds("testnet") → { espace, core }');
  console.log('    Private keys NEVER leave the Signer/account.');
}
