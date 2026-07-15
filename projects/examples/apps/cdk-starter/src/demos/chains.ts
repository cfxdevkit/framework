import {
  espaceMainnet,
  espaceTestnet,
  coreSpaceMainnet,
  coreSpaceTestnet,
  listChains,
  getChain,
} from '@cfxdevkit/cdk/chains';

export async function demoChains(): Promise<void> {
  console.log('\n  All chains in the catalog:');
  for (const chain of listChains()) {
    const network = chain.network.toUpperCase().padEnd(8);
    const family = chain.family.padEnd(7);
    console.log(`    ${network} ${family} ${chain.name.padEnd(18)} id=${chain.id}  "${chain.displayName}"`);
  }

  console.log('\n  ── eSpace ───────────────────────────────────────────────');
  console.log(`    mainnet (1030): ${espaceMainnet.rpc.http[0]}`);
  console.log(`    testnet (71):   ${espaceTestnet.rpc.http[0]}`);
  console.log(`    explorer:       ${espaceMainnet.explorer?.url}`);
  console.log(`    token:          ${espaceMainnet.nativeToken.symbol} (${espaceMainnet.nativeToken.decimals} dec)`);
  console.log(`    ws RPC:         ${espaceMainnet.rpc.ws?.[0] ?? '(none)'}`);

  console.log('\n  ── Core Space ─────────────────────────────────────────────');
  console.log(`    mainnet (1029): ${coreSpaceMainnet.rpc.http[0]}`);
  console.log(`    testnet (1):    ${coreSpaceTestnet.rpc.http[0]}`);
  console.log(`    explorer:       ${coreSpaceMainnet.explorer?.url}`);
  console.log(`    token:          ${coreSpaceMainnet.nativeToken.symbol} (${coreSpaceMainnet.nativeToken.decimals} dec)`);
  console.log(`    ws RPC:         ${coreSpaceMainnet.rpc.ws?.[0] ?? '(none)'}`);

  console.log('\n  Lookup by numeric id:');
  console.log(`    getChain(1030) → ${getChain(1030).name} (${getChain(1030).family})`);
  console.log(`    getChain(71)   → ${getChain(71).name} (${getChain(71).family})`);
  console.log(`    getChain(1029) → ${getChain(1029).name} (${getChain(1029).family})`);
  console.log(`    getChain(1)    → ${getChain(1).name} (${getChain(1).family})`);

  console.log('\n  Filter by family:');
  console.log(`    eSpace chains:  ${listChains({ family: 'espace' }).map((c) => c.name).join(', ')}`);
  console.log(`    Core chains:    ${listChains({ family: 'core' }).map((c) => c.name).join(', ')}`);

  console.log('\n  Unknown chain throws CfxError:');
  try {
    getChain(9999);
  } catch (err) {
    console.log(`    → ${(err as Error).message}`);
  }
}
