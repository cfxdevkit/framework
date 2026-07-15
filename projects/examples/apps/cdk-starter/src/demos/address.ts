import { hexToBase32, base32ToHex, isBase32Address, getCoreAddress } from '@cfxdevkit/cdk/address';

export async function demoAddress(): Promise<void> {
  const HEX = '0x08f1d158019e76d6e0c26609c384301331204377';

  console.log('\n  eSpace addresses:  hex (0x...)');
  console.log('  Core Space addresses: base32 (cfx:...)');
  console.log('  hexToBase32 is a TEXT ENCODING — not a space conversion.');
  console.log('  It encodes the same 20 bytes into base32 format.');
  console.log("  Real Core Space addresses come from HD path m/44'/503'/...");

  console.log('\n  Source 20-byte hex:');
  console.log(`    ${HEX}`);

  console.log('\n  Encode as base32 (mainnet, networkId 1029):');
  const mainnetAddr = hexToBase32(HEX, 1029);
  console.log(`    ${mainnetAddr}`);

  console.log('\n  Encode as base32 (testnet, networkId 1):');
  const testnetAddr = hexToBase32(HEX, 1);
  console.log(`    ${testnetAddr}`);

  console.log('\n  Round-trip (base32 → hex):');
  const backToHex = base32ToHex(mainnetAddr);
  console.log(`    base32ToHex("${mainnetAddr}") = ${backToHex}`);
  console.log(`    matches original: ${backToHex.toLowerCase() === HEX.toLowerCase()}`);

  console.log('\n  Normalise:');
  console.log(`    getCoreAddress("${mainnetAddr}") = ${getCoreAddress(mainnetAddr)}`);

  console.log('\n  Validation:');
  console.log(`    isBase32Address("${mainnetAddr}") = ${isBase32Address(mainnetAddr)}`);
  console.log(`    isBase32Address("${HEX}") = ${isBase32Address(HEX)}`);
}
